/**
 * Reactive embed: the look plus its pointer / hover / scroll / click routes,
 * as a framework-free snippet for any website.
 *
 * The runtime has no effect code, only shaders, so each route is baked in as
 * the uniform change at full signal, scaled by the live signal.
 */
import { drawList, layerMix, layerTime, toUniforms } from "@/lib/studio/renderer";
import { SCHEMA_BY_KEY, type SectionKey, type StudioState } from "@/lib/studio/schema";
import { LAYER_SHADERS, VERTEX_SHADER } from "@/lib/studio/shader";
import type { Route, Signal } from "./drive";

type U = number | number[];

/** Signals a website visitor can produce. Sound stays in the Lab. */
export const EMBED_SIGNALS: Signal[] = ["pointer x", "pointer y", "pointer speed", "hover", "click", "scroll", "beat"];

export type ReactiveLook = {
  uniforms: Record<string, U>;
  time: number;
  layers: { key: SectionKey; frozen?: number; o: number; b: number }[];
  routes?: { signal: Signal; smoothing: number; delta: Record<string, U> }[];
  bpm?: number;
};

const round = (v: U): U => (Array.isArray(v) ? v.map((n) => +n.toFixed(4)) : +v.toFixed(4));
const sub = (a: U, b: U): U => (Array.isArray(a) && Array.isArray(b) ? a.map((x, i) => x - b[i]) : Number(a) - Number(b));
const isZero = (v: U) => (Array.isArray(v) ? v.every((n) => Math.abs(n) < 1e-5) : Math.abs(v) < 1e-5);

function applyRouteFull(state: StudioState, r: Route): StudioState {
  const c = SCHEMA_BY_KEY[r.section].controls.find((x) => x.key === r.control);
  if (!c || c.type !== "slider" || !state.order.includes(r.section)) return state;
  const s = state.sections[r.section];
  const v = Math.min(c.max, Math.max(c.min, Number(s[c.key]) + r.amount * (c.max - c.min)));
  return { ...state, sections: { ...state.sections, [r.section]: { ...s, [c.key]: v } } };
}

export function reactiveLook(state: StudioState, routes: Route[], time: number, bpm: number | null): ReactiveLook {
  const start = state;
  const raw = toUniforms(start, false);
  const uniforms = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, round(v)]));
  const layers = drawList(start, false).map((key) => {
    const { opacity, blend } = layerMix(start, key);
    const mix = { o: +opacity.toFixed(3), b: blend };
    return start.sections[key].animated ? { key, ...mix } : { key, ...mix, frozen: +layerTime(start, key, time).toFixed(3) };
  });
  const look: ReactiveLook = { uniforms, time: +time.toFixed(3), layers };

  const live = routes.filter((r) => EMBED_SIGNALS.includes(r.signal) && r.amount !== 0);
  if (live.length) {
    look.routes = live.flatMap((r) => {
      const full = toUniforms(applyRouteFull(start, r), false);
      const delta: Record<string, U> = {};
      for (const [k, v] of Object.entries(full)) {
        // Against the unrounded base, so rounding doesn't read as movement.
        const d = sub(v, raw[k]);
        if (!isZero(d)) delta[k] = round(d);
      }
      return Object.keys(delta).length ? [{ signal: r.signal, smoothing: r.smoothing, delta }] : [];
    });
  }
  if (bpm && live.some((r) => r.signal === "beat")) look.bpm = bpm;
  return look;
}

const minify = (src: string) =>
  src
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, "").trim())
    .filter(Boolean)
    .join("\n");

const shaders = (keys: SectionKey[]) =>
  JSON.stringify({ vs: minify(VERTEX_SHADER), fx: Object.fromEntries(keys.map((k) => [k, minify(LAYER_SHADERS[k])])) });

const RUNTIME = `function mountImaginry(canvas, look, opts) {
  opts = opts || {};
  var S = SHADERS;
  var gl = canvas.getContext("webgl2", { antialias: false, depth: false, premultipliedAlpha: false });
  if (!gl) return function () {};
  function program(fs) {
    var p = gl.createProgram();
    [[gl.VERTEX_SHADER, S.vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(p, sh);
    });
    gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p); return p;
  }
  var layers = look.layers.filter(function (l) { return S.fx[l.key]; }).map(function (l) {
    return { p: program(S.fx[l.key]), frozen: l.frozen, o: l.o == null ? 1 : l.o, b: l.b || 0 };
  });
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  function texture(wrap) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  }
  var base = texture(gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 10, 10, 255]));
  var targets = [0, 1].map(function () { return { tex: texture(gl.MIRRORED_REPEAT), fbo: gl.createFramebuffer() }; });
  var size = [0, 0];
  function set(p, u) {
    for (var k in u) {
      var l = gl.getUniformLocation(p, k), v = u[k];
      if (!l) continue;
      if (typeof v === "number") gl.uniform1f(l, v); else if (v.length === 2) gl.uniform2fv(l, v); else gl.uniform3fv(l, v);
    }
  }
  function add(a, b, k) {
    if (typeof a === "number") return a + b * k;
    return a.map(function (x, i) { return x + b[i] * k; });
  }
  // Live signals from the visitor
  var sig = { "pointer x": 0.5, "pointer y": 0.5, "pointer speed": 0, hover: 0, click: 0, scroll: 0, beat: 0 };
  var inside = false;
  var smooth = (look.routes || []).map(function () { return 0; });
  var last = null;
  function onMove(e) {
    var r = canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) { last = null; inside = false; return; }
    inside = true;
    var now = performance.now();
    if (last) {
      var v = Math.hypot(x - last.x, y - last.y) / Math.max(0.001, (now - last.t) / 1000);
      sig["pointer speed"] = Math.min(1, Math.max(sig["pointer speed"], v / 3));
    }
    sig["pointer x"] = x; sig["pointer y"] = y; last = { x: x, y: y, t: now };
  }
  function onDown(e) {
    var r = canvas.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) sig.click = 1;
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  var start = performance.now(), prev = start, raf = 0, speed = opts.speed == null ? 1 : opts.speed;
  function draw(now) {
    var dt = Math.min(0.1, (now - prev) / 1000); prev = now;
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
    var real = (now - start) / 1000;
    var r = canvas.getBoundingClientRect(), vh = window.innerHeight;
    // A fixed background follows the page's scroll; an inline canvas, its own trip through the viewport.
    sig.scroll = getComputedStyle(canvas).position === "fixed"
      ? Math.min(1, Math.max(0, window.scrollY / Math.max(1, document.documentElement.scrollHeight - vh)))
      : Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    sig.click *= Math.exp(-dt * 5); sig["pointer speed"] *= Math.exp(-dt * 3);
    sig.hover += ((inside ? 1 : 0) - sig.hover) * (1 - Math.exp(-dt * 6));
    sig.beat = look.bpm ? Math.pow(1 - ((real * look.bpm) / 60) % 1, 3) : 0;
    var u = Object.assign({}, look.uniforms);
    (look.routes || []).forEach(function (route, i) {
      var target = sig[route.signal] || 0, s = route.smoothing;
      smooth[i] += (target - smooth[i]) * (s <= 0 ? 1 : 1 - Math.pow(s, dt * 60));
      for (var name in route.delta) u[name] = add(u[name], route.delta[name], smooth[i]);
    });
    var time = look.time + real * speed;
    gl.viewport(0, 0, w, h);
    layers.forEach(function (layer, i) {
      var lastLayer = i === layers.length - 1;
      gl.bindFramebuffer(gl.FRAMEBUFFER, lastLayer ? null : targets[i % 2].fbo);
      gl.useProgram(layer.p);
      set(layer.p, Object.assign(u, { uRes: [w, h], uDetail: 1, uPixel: 1, uImgSize: [1, 1], uTime: layer.frozen == null ? time : layer.frozen, uLayerOpacity: layer.o, uLayerBlend: layer.b }));
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, i === 0 ? base : targets[(i - 1) % 2].tex);
      gl.uniform1i(gl.getUniformLocation(layer.p, "uInput"), 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return function () {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
  };
}`;

const runtime = (look: ReactiveLook) => RUNTIME.replace("var S = SHADERS;", () => `var S = ${shaders(look.layers.map((l) => l.key))};`);

export function reactiveHtml(look: ReactiveLook) {
  return `<!-- Imaginry reactive look. Size the canvas with CSS; it fills its box and follows the cursor, clicks and scroll. -->
<canvas id="imaginry" style="display:block;width:100%;height:100%"></canvas>
<script>
${runtime(look)}
mountImaginry(document.getElementById("imaginry"), ${JSON.stringify(look)}, { speed: 1 });
</script>
`;
}

export function reactiveReact(look: ReactiveLook) {
  return `"use client";
// @ts-nocheck
import { useEffect, useRef } from "react";

const LOOK = ${JSON.stringify(look)};

${runtime(look)}

/** Follows the cursor, hover, clicks and scroll; size it with className or style. */
export default function ImaginryReactive({ className, style, speed = 1 }) {
  const ref = useRef(null);
  useEffect(() => mountImaginry(ref.current, LOOK, { speed }), [speed]);
  return <canvas ref={ref} className={className} style={{ display: "block", width: "100%", height: "100%", ...style }} />;
}
`;
}

/** A whole page with the look as a fixed background, to try it before pasting. */
export function demoPage(look: ReactiveLook) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Imaginry reactive look</title>
<style>
  html, body { margin: 0; background: #0d0c0b; color: #ede7dc; font-family: system-ui, sans-serif; }
  #imaginry { position: fixed; inset: 0; width: 100vw; height: 100vh; display: block; }
  main { position: relative; max-width: 720px; margin: 0 auto; padding: 30vh 24px 60vh; }
  h1 { font-size: clamp(36px, 6vw, 64px); line-height: 1.02; margin: 0 0 16px; }
  p { font-size: 17px; line-height: 1.6; opacity: 0.8; max-width: 460px; }
  section { margin-top: 70vh; }
</style>
</head>
<body>
<canvas id="imaginry"></canvas>
<main>
  <h1>Your hero, on a look that answers back</h1>
  <p>Move the cursor, click, and scroll. Replace this page's content with yours.</p>
  <section><h1>Scroll keeps going</h1><p>Anything mapped to scroll follows the page.</p></section>
</main>
<script>
${runtime(look)}
mountImaginry(document.getElementById("imaginry"), ${JSON.stringify(look)}, { speed: 1 });
</script>
</body>
</html>
`;
}
