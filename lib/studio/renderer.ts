import { EFFECTS } from "./effects";
import type { Sections, Uniform } from "./effects/define";
import { BLEND_MODES, SECTION_KEYS, type SectionKey, type StudioState } from "./schema";
import { LAYER_SHADERS, VERTEX_SHADER } from "./shader";

export { hexToRgb } from "./effects/define";

/** How a layer sits on the one below: its opacity and blend mode index. */
export function layerMix(state: StudioState, key: SectionKey) {
  const s = state.sections[key];
  const opacity = s.layerOpacity == null ? 1 : Number(s.layerOpacity);
  const blend = Math.max(0, BLEND_MODES.indexOf(String(s.layerBlend ?? "normal")));
  return { opacity: Number.isFinite(opacity) ? opacity : 1, blend };
}

/** Uniforms for every effect (each effect file supplies its own), plus the seed. */
export function toUniforms(state: StudioState, hasImage: boolean): Record<string, Uniform> {
  const sections = state.sections as unknown as Sections;
  const out: Record<string, Uniform> = { uSeed: state.seed };
  for (const effect of EFFECTS) Object.assign(out, effect.uniforms(sections, { hasImage }));
  return out;
}

type Pass = { program: WebGLProgram; locations: Map<string, WebGLUniformLocation | null> };

/** Visible layers, bottom first, in the order they are drawn. */
export function drawList(state: StudioState, hasImage: boolean): SectionKey[] {
  return [...state.order].reverse().filter((k) => state.sections[k].enabled && (k !== "image" || hasImage));
}

/** The animation clock a layer sees: frozen layers hold their own time. */
export function layerTime(state: StudioState, key: SectionKey, time: number) {
  const s = state.sections[key];
  return s.animated ? time : Number(s.frozenTime) || 0;
}

/**
 * Layer-stack renderer. Each visible layer is a full-screen pass that reads
 * the layer below from a ping-pong texture; the top layer draws to the canvas.
 */
export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private passes = {} as Record<SectionKey, Pass>;
  private imageTex: WebGLTexture;
  private baseTex: WebGLTexture;
  private targets: { tex: WebGLTexture; fbo: WebGLFramebuffer }[] = [];
  private targetSize = [0, 0];
  private imageSize: [number, number] = [1, 1];
  hasImage = false;
  /** Resolves once every layer program is linked; rejects with the compile log. */
  readonly ready: Promise<void>;
  private isReady = false;

  constructor(canvas: HTMLCanvasElement, preserveDrawingBuffer = false) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is not supported in this browser.");
    if (gl.isContextLost()) throw new Error("The GPU context was lost. Reload the page to try again.");
    this.gl = gl;

    // With KHR_parallel_shader_compile the driver compiles off the main
    // thread; we poll for completion instead of blocking on LINK_STATUS.
    const parallel = gl.getExtension("KHR_parallel_shader_compile");
    for (const key of SECTION_KEYS) this.passes[key] = this.link(LAYER_SHADERS[key]);
    this.ready = this.waitForLink(parallel !== null).then(() => {
      this.isReady = true;
    });

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.imageTex = this.createTexture(gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    // What the bottom layer sees underneath it.
    this.baseTex = this.createTexture(gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 10, 10, 255]));
    for (let i = 0; i < 2; i++) {
      // Mirrored so distortions that sample past the edge don't smear.
      this.targets.push({ tex: this.createTexture(gl.MIRRORED_REPEAT), fbo: gl.createFramebuffer()! });
    }
  }

  private link(fragment: string): Pass {
    const gl = this.gl;
    const program = gl.createProgram()!;
    const shaders = [
      [gl.VERTEX_SHADER, VERTEX_SHADER],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const;
    for (const [type, source] of shaders) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    return { program, locations: new Map() };
  }

  private async waitForLink(parallel: boolean) {
    const gl = this.gl;
    const COMPLETION_STATUS_KHR = 0x91b1;
    const passes = Object.entries(this.passes);
    if (parallel) {
      while (!passes.every(([, p]) => gl.getProgramParameter(p.program, COMPLETION_STATUS_KHR))) {
        if (gl.isContextLost()) throw new Error("The GPU context was lost while compiling shaders.");
        await new Promise((r) => setTimeout(r, 16));
      }
    }
    for (const [name, { program }] of passes) {
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) continue;
      const logs = gl
        .getAttachedShaders(program)!
        .map((sh) => gl.getShaderInfoLog(sh))
        .filter(Boolean)
        .join("\n");
      const message = `${name} shader failed to compile:\n${logs || gl.getProgramInfoLog(program)}`;
      console.error(message);
      throw new Error(message);
    }
  }

  private createTexture(wrap: number) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return tex;
  }

  setImage(image: TexImageSource | null) {
    const gl = this.gl;
    if (!image) {
      this.hasImage = false;
      return;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.imageTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // Mipmaps back the image blur.
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    const { width, height } = image as { width: number; height: number };
    this.imageSize = [width || 1, height || 1];
    this.hasImage = true;
  }

  private location(pass: Pass, name: string) {
    if (!pass.locations.has(name)) pass.locations.set(name, this.gl.getUniformLocation(pass.program, name));
    return pass.locations.get(name)!;
  }

  private applyUniforms(pass: Pass, uniforms: Record<string, Uniform>) {
    const gl = this.gl;
    for (const [name, value] of Object.entries(uniforms)) {
      const loc = this.location(pass, name);
      if (!loc) continue;
      if (typeof value === "number") gl.uniform1f(loc, value);
      else if (value.length === 2) gl.uniform2fv(loc, value);
      else gl.uniform3fv(loc, value);
    }
  }

  private ensureTargets(width: number, height: number) {
    if (this.targetSize[0] === width && this.targetSize[1] === height) return;
    const gl = this.gl;
    for (const t of this.targets) {
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
    }
    this.targetSize = [width, height];
  }

  /** `detail` scales pixel-based effects (thumbnails use > 1 to stay legible). */
  render(state: StudioState, time: number, detail = 1) {
    const gl = this.gl;
    if (!this.isReady || gl.isContextLost()) return;
    const { width, height } = this.canvas;
    const shared: Record<string, Uniform> = {
      ...toUniforms(state, this.hasImage),
      uRes: [width, height],
      uDetail: detail,
      uImgSize: this.imageSize,
    };
    gl.viewport(0, 0, width, height);

    const layers = drawList(state, this.hasImage);
    if (layers.length === 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(10 / 255, 10 / 255, 10 / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    if (layers.length > 1) this.ensureTargets(width, height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTex);
    layers.forEach((key, i) => {
      const pass = this.passes[key];
      const last = i === layers.length - 1;
      gl.bindFramebuffer(gl.FRAMEBUFFER, last ? null : this.targets[i % 2].fbo);
      gl.useProgram(pass.program);
      const mix = layerMix(state, key);
      this.applyUniforms(pass, {
        ...shared,
        uTime: layerTime(state, key, time),
        uLayerOpacity: mix.opacity,
        uLayerBlend: mix.blend,
      });
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, i === 0 ? this.baseTex : this.targets[(i - 1) % 2].tex);
      gl.uniform1i(this.location(pass, "uInput"), 1);
      gl.uniform1i(this.location(pass, "uImg"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  dispose() {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

let offscreen: Renderer | null = null;

/**
 * One shared context for thumbnails, saves and exports, so the page never
 * holds more than two WebGL contexts or compiles the shaders more than twice.
 */
export async function renderOffscreen(
  state: StudioState,
  width: number,
  height: number,
  options: { time?: number; detail?: number; image?: TexImageSource | null } = {},
) {
  if (!offscreen || offscreen.canvas.getContext("webgl2")?.isContextLost()) {
    offscreen = new Renderer(document.createElement("canvas"), true);
  }
  const renderer = offscreen;
  await renderer.ready;
  const canvas = renderer.canvas;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  renderer.setImage(options.image ?? null);
  renderer.render(state, options.time ?? 0, options.detail ?? 1);
  // Hand back a private copy: callers await, and another render could reuse
  // the shared canvas before they read it.
  const copy = document.createElement("canvas");
  copy.width = width;
  copy.height = height;
  copy.getContext("2d")!.drawImage(canvas, 0, 0);
  return copy;
}
