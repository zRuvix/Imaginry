/**
 * A small GPU fluid simulation (stable fluids: advection, vorticity, pressure
 * projection) that the cursor stirs. It runs in its own WebGL2 context and
 * draws its ink to `canvas`, which the Lab hands to the renderer as the image
 * texture each frame; the Fluid layer reads it from there.
 */
import { hexToRgb } from "@/lib/studio/effects/define";

export type FluidParams = {
  colors: string[];
  /** Swirl strength (vorticity confinement). */
  curl: number;
  /** How fast the ink fades, per second. */
  fade: number;
  /** How fast motion dies down, per second. */
  drag: number;
  /** How hard the cursor pushes. */
  force: number;
  /** Size of the cursor's splat, as a share of the height. */
  radius: number;
  /** 0..1: a slow stir by itself while the cursor is away. */
  auto: number;
};

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 o;
uniform vec2 uTexel;
`;

const FRAG = {
  splat: `${HEAD}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  o = vec4(texture(uTarget, vUv).xyz + uColor * exp(-dot(p, p) / uRadius), 1.0);
}`,
  advect: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  o = texture(uSource, coord) / (1.0 + uDissipation * uDt);
}`,
  divergence: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  o = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`,
  curl: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  o = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`,
  vorticity: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlAmount;
uniform float uDt;
void main() {
  float l = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float c = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 0.0001;
  force *= uCurlAmount * c;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`,
  pressure: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  o = vec4(texture(uVelocity, vUv).xy - vec2(r - l, t - b), 0.0, 1.0);
}`,
  scale: `${HEAD}
uniform sampler2D uSource;
uniform float uValue;
void main() { o = texture(uSource, vUv) * uValue; }`,
  display: `${HEAD}
uniform sampler2D uSource;
void main() {
  vec3 c = texture(uSource, vUv).rgb;
  // Soft tone curve so dense ink doesn't clip to white.
  c = 1.0 - exp(-c * 1.4);
  o = vec4(c, 1.0);
}`,
};

type Program = { p: WebGLProgram; u: Map<string, WebGLUniformLocation | null> };
type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type Double = { read: Target; write: Target; swap: () => void };

const SIM = 128;
const DYE = 512;
const PRESSURE_STEPS = 20;

export class FluidSim {
  readonly canvas = document.createElement("canvas");
  private gl: WebGL2RenderingContext;
  private programs = {} as Record<keyof typeof FRAG, Program>;
  private velocity!: Double;
  private dye!: Double;
  private pressure!: Double;
  private divergence!: Target;
  private curl!: Target;
  private size = [0, 0];
  private splats: { x: number; y: number; dx: number; dy: number; color: number[] }[] = [];
  private lastMove = -Infinity;
  private t = 0;
  private colorIndex = 0;
  readonly ok: boolean;

  constructor() {
    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    this.ok = !!gl && !!gl.getExtension("EXT_color_buffer_float");
    this.gl = gl!;
    if (!this.ok) return;
    gl!.getExtension("OES_texture_float_linear");
    for (const [name, src] of Object.entries(FRAG)) this.programs[name as keyof typeof FRAG] = this.link(src);
    const buf = gl!.createBuffer();
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
    gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW);
    gl!.enableVertexAttribArray(0);
    gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
  }

  private link(frag: string): Program {
    const gl = this.gl;
    const p = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, frag],
    ] as const) {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    }
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    return { p, u: new Map() };
  }

  private target(w: number, h: number): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h };
  }

  private double(w: number, h: number): Double {
    const d = { read: this.target(w, h), write: this.target(w, h), swap: () => ([d.read, d.write] = [d.write, d.read]) };
    return d;
  }

  /** Matches the display's aspect; resets the fluid when the shape changes. */
  resize(aspect: number) {
    if (!this.ok) return;
    const a = Math.max(0.25, Math.min(4, aspect));
    const sim = a >= 1 ? [Math.round(SIM * a), SIM] : [SIM, Math.round(SIM / a)];
    if (sim[0] === this.size[0] && sim[1] === this.size[1]) return;
    this.size = sim;
    const dye = a >= 1 ? [Math.round(DYE * a), DYE] : [DYE, Math.round(DYE / a)];
    this.velocity = this.double(sim[0], sim[1]);
    this.pressure = this.double(sim[0], sim[1]);
    this.divergence = this.target(sim[0], sim[1]);
    this.curl = this.target(sim[0], sim[1]);
    this.dye = this.double(dye[0], dye[1]);
    this.canvas.width = Math.round(dye[0] / 2);
    this.canvas.height = Math.round(dye[1] / 2);
  }

  /** Cursor motion in canvas fractions (0..1, top left). */
  move(x: number, y: number, dx: number, dy: number, colors: string[]) {
    if (!this.ok || (dx === 0 && dy === 0)) return;
    this.lastMove = this.t;
    // Fill in fast moves with a splat every little step, so trails stay continuous.
    const steps = Math.min(16, Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.015)));
    for (let i = steps - 1; i >= 0; i--) {
      const k = i / steps;
      this.splats.push({ x: x - dx * k, y: 1 - (y - dy * k), dx: dx / steps, dy: -dy / steps, color: this.nextColor(colors) });
    }
  }

  /** A click: a burst of ink with no push. */
  burst(x: number, y: number, colors: string[]) {
    if (!this.ok) return;
    const c = this.nextColor(colors).map((v) => v * 3);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.splats.push({ x, y: 1 - y, dx: Math.cos(a) * 0.004, dy: Math.sin(a) * 0.004, color: c });
    }
  }

  private nextColor(colors: string[]) {
    const list = colors.length ? colors : ["#ffffff"];
    // Walk the palette slowly so trails shade from one color into the next.
    this.colorIndex = (this.colorIndex + 0.04) % list.length;
    const i = Math.floor(this.colorIndex);
    const a = hexToRgb(list[i]);
    const b = hexToRgb(list[(i + 1) % list.length]);
    const k = this.colorIndex - i;
    return a.map((v, j) => (v + (b[j] - v) * k) * 0.35);
  }

  private use(name: keyof typeof FRAG, uniforms: Record<string, number | number[] | WebGLTexture>, target: Target | null) {
    const gl = this.gl;
    const prog = this.programs[name];
    gl.useProgram(prog.p);
    let unit = 0;
    for (const [k, v] of Object.entries(uniforms)) {
      if (!prog.u.has(k)) prog.u.set(k, gl.getUniformLocation(prog.p, k));
      const loc = prog.u.get(k)!;
      if (v instanceof WebGLTexture) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, v);
        gl.uniform1i(loc, unit++);
      } else if (typeof v === "number") gl.uniform1f(loc, v);
      else if (v.length === 2) gl.uniform2fv(loc, v);
      else gl.uniform3fv(loc, v);
    }
    const w = target ? target.w : this.canvas.width;
    const h = target ? target.h : this.canvas.height;
    gl.viewport(0, 0, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private splat(s: { x: number; y: number; dx: number; dy: number; color: number[] }, p: FluidParams) {
    const aspect = this.size[0] / this.size[1];
    const radius = (p.radius * p.radius) / 40;
    const force = p.force * 6000;
    this.use(
      "splat",
      { uTarget: this.velocity.read.tex, uAspect: aspect, uPoint: [s.x, s.y], uColor: [s.dx * force, s.dy * force, 0], uRadius: radius },
      this.velocity.write,
    );
    this.velocity.swap();
    this.use(
      "splat",
      { uTarget: this.dye.read.tex, uAspect: aspect, uPoint: [s.x, s.y], uColor: s.color, uRadius: radius },
      this.dye.write,
    );
    this.dye.swap();
  }

  step(dt: number, p: FluidParams) {
    if (!this.ok || !this.size[0]) return;
    this.t += dt;
    const simTexel = [1 / this.size[0], 1 / this.size[1]];

    // Idle: a slow figure-eight stir, so the fluid never sits dead.
    if (p.auto > 0 && this.t - this.lastMove > 1.5) {
      const a = this.t * 0.35;
      const x = 0.5 + Math.sin(a) * 0.32;
      const y = 0.5 + Math.sin(a * 2) * 0.18;
      const dx = Math.cos(a) * 0.32 * 0.35 * dt * p.auto;
      const dy = Math.cos(a * 2) * 0.36 * 0.35 * dt * p.auto;
      this.splats.push({ x, y, dx, dy, color: this.nextColor(p.colors).map((v) => v * p.auto) });
    }
    for (const s of this.splats.splice(0)) this.splat(s, p);

    this.use("curl", { uTexel: simTexel, uVelocity: this.velocity.read.tex }, this.curl);
    this.use(
      "vorticity",
      { uTexel: simTexel, uVelocity: this.velocity.read.tex, uCurl: this.curl.tex, uCurlAmount: p.curl, uDt: dt },
      this.velocity.write,
    );
    this.velocity.swap();
    this.use("divergence", { uTexel: simTexel, uVelocity: this.velocity.read.tex }, this.divergence);
    this.use("scale", { uTexel: simTexel, uSource: this.pressure.read.tex, uValue: 0.8 }, this.pressure.write);
    this.pressure.swap();
    for (let i = 0; i < PRESSURE_STEPS; i++) {
      this.use("pressure", { uTexel: simTexel, uPressure: this.pressure.read.tex, uDivergence: this.divergence.tex }, this.pressure.write);
      this.pressure.swap();
    }
    this.use("gradient", { uTexel: simTexel, uPressure: this.pressure.read.tex, uVelocity: this.velocity.read.tex }, this.velocity.write);
    this.velocity.swap();
    this.use(
      "advect",
      { uTexel: simTexel, uVelocity: this.velocity.read.tex, uSource: this.velocity.read.tex, uDt: dt, uDissipation: p.drag },
      this.velocity.write,
    );
    this.velocity.swap();
    this.use(
      "advect",
      { uTexel: simTexel, uVelocity: this.velocity.read.tex, uSource: this.dye.read.tex, uDt: dt, uDissipation: p.fade },
      this.dye.write,
    );
    this.dye.swap();
    this.use("display", { uTexel: [1 / this.canvas.width, 1 / this.canvas.height], uSource: this.dye.read.tex }, null);
  }

  dispose() {
    this.gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
