import { drawList, layerMix, layerTime, toUniforms } from "./renderer";
import { SECTION_KEYS, type SectionKey, type StudioState } from "./schema";
import { LAYER_SHADERS, VERTEX_SHADER } from "./shader";

/** Drops comments, indentation and blank lines; GLSL needs the newlines after directives. */
function minifyGlsl(src: string) {
  return src
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, "").trim())
    .filter(Boolean)
    .join("\n");
}

/** Visible layers bottom first; `frozen` is set for layers that don't animate. */
export type Look = {
  uniforms: Record<string, number | number[]>;
  time: number;
  layers: { key: SectionKey; frozen?: number; o: number; b: number }[];
};

export function lookFor(state: StudioState, time: number): Look {
  const uniforms = toUniforms(state, false);
  // Round so the pasted look stays short.
  for (const [k, v] of Object.entries(uniforms)) {
    uniforms[k] = Array.isArray(v) ? v.map((n) => +n.toFixed(4)) : +v.toFixed(4);
  }
  const layers = drawList(state, false).map((key) => {
    const { opacity, blend } = layerMix(state, key);
    const mix = { o: +opacity.toFixed(3), b: blend };
    return state.sections[key].animated
      ? { key, ...mix }
      : { key, ...mix, frozen: +layerTime(state, key, time).toFixed(3) };
  });
  return { uniforms, time: +time.toFixed(3), layers };
}

const shadersFor = (keys: readonly SectionKey[]) =>
  JSON.stringify({
    vs: minifyGlsl(VERTEX_SHADER),
    fx: Object.fromEntries(keys.map((k) => [k, minifyGlsl(LAYER_SHADERS[k])])),
  });

/**
 * Framework-free runtime shared by every embed. `mountImaginry(canvas, look, opts)`
 * draws the look's layers into the canvas and returns a cleanup function.
 */
const RUNTIME = `function mountImaginry(canvas, look, opts) {
  opts = opts || {};
  var S = SHADERS;
  var gl = canvas.getContext("webgl2", { antialias: false, depth: false, premultipliedAlpha: false });
  if (!gl) return function () {};
  function program(fs) {
    var p = gl.createProgram();
    [[gl.VERTEX_SHADER, S.vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]);
      gl.shaderSource(sh, s[1]);
      gl.compileShader(sh);
      gl.attachShader(p, sh);
    });
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    return p;
  }
  var layers = look.layers.filter(function (l) { return S.fx[l.key]; }).map(function (l) {
    return { p: program(S.fx[l.key]), frozen: l.frozen, o: l.o == null ? 1 : l.o, b: l.b || 0 };
  });
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  function texture(wrap) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  }
  var base = texture(gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 10, 10, 255]));
  var targets = [0, 1].map(function () { return { tex: texture(gl.MIRRORED_REPEAT), fbo: gl.createFramebuffer() }; });
  var size = [0, 0];
  function uniforms(p, u) {
    for (var k in u) {
      var l = gl.getUniformLocation(p, k), v = u[k];
      if (!l) continue;
      if (typeof v === "number") gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2fv(l, v);
      else gl.uniform3fv(l, v);
    }
  }
  var start = performance.now(), raf = 0, speed = opts.speed == null ? 1 : opts.speed;
  function draw(now) {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    if (size[0] !== w || size[1] !== h) {
      targets.forEach(function (t) {
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
      });
      size = [w, h];
    }
    var time = look.time + (opts.animate === false ? 0 : ((now - start) / 1000) * speed);
    gl.viewport(0, 0, w, h);
    layers.forEach(function (layer, i) {
      var last = i === layers.length - 1;
      gl.bindFramebuffer(gl.FRAMEBUFFER, last ? null : targets[i % 2].fbo);
      gl.useProgram(layer.p);
      uniforms(layer.p, Object.assign({}, look.uniforms, {
        uRes: [w, h], uDetail: 1, uPixel: 1, uImgSize: [1, 1], uTime: layer.frozen == null ? time : layer.frozen,
        uLayerOpacity: layer.o, uLayerBlend: layer.b
      }));
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, i === 0 ? base : targets[(i - 1) % 2].tex);
      gl.uniform1i(gl.getUniformLocation(layer.p, "uInput"), 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    if (opts.animate !== false) raf = requestAnimationFrame(draw);
  }
  var ro = new ResizeObserver(function () { if (opts.animate === false) draw(performance.now()); });
  ro.observe(canvas);
  raf = requestAnimationFrame(draw);
  return function () { cancelAnimationFrame(raf); ro.disconnect(); };
}`;

/** Inlines only the layer shaders the embed needs. */
const runtime = (keys: readonly SectionKey[]) =>
  RUNTIME.replace("var S = SHADERS;", () => `var S = ${shadersFor(keys)};`);

const used = (look: Look) => look.layers.map((l) => l.key);

export function htmlEmbed(look: Look, animate: boolean) {
  return `<!-- Imaginry look. Size the canvas with CSS; it fills its box. -->
<canvas id="imaginry" style="display:block;width:100%;height:100%"></canvas>
<script>
${runtime(used(look))}
mountImaginry(document.getElementById("imaginry"), ${JSON.stringify(look)}, { animate: ${animate}, speed: 1 });
</script>
`;
}

export function reactEmbed(look: Look, animate: boolean) {
  return `"use client";
// @ts-nocheck
import { useEffect, useRef } from "react";

const LOOK = ${JSON.stringify(look)};

${runtime(used(look))}

export default function ImaginryLook({ className, style, animate = ${animate}, speed = 1 }) {
  const ref = useRef(null);
  useEffect(() => mountImaginry(ref.current, LOOK, { animate, speed }), [animate, speed]);
  return <canvas ref={ref} className={className} style={{ display: "block", width: "100%", height: "100%", ...style }} />;
}
`;
}

/** The Framer component carries every layer shader, since any look can be pasted into it. */
export function framerComponent() {
  return `// @ts-nocheck
import { addPropertyControls, ControlType } from "framer";
import { useEffect, useRef } from "react";

${runtime(SECTION_KEYS)}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ImaginryLook({ look, animate, speed, style }) {
  const ref = useRef(null);
  useEffect(() => {
    let parsed;
    try { parsed = JSON.parse(look); } catch { return; }
    return mountImaginry(ref.current, parsed, { animate, speed });
  }, [look, animate, speed]);
  return <canvas ref={ref} style={{ display: "block", width: "100%", height: "100%", ...style }} />;
}

addPropertyControls(ImaginryLook, {
  look: { type: ControlType.String, title: "Look", displayTextArea: true, defaultValue: "" },
  animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true },
  speed: { type: ControlType.Number, title: "Speed", min: 0, max: 4, step: 0.1, defaultValue: 1 },
});
`;
}

export function framerLook(look: Look) {
  return JSON.stringify(look);
}
