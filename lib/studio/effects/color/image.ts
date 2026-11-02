import { type Control, defineEffect, n, opt, slider } from "../define";

/** Zoom and pan limits, shared with the canvas gestures in the studio. */
export const IMAGE_ZOOM = { min: 0.2, max: 5 };
export const IMAGE_PAN = 3;

const controls: Control[] = [
  slider("blur", "Blur", 0, 1, 0.01),
  slider("scale", "Zoom", IMAGE_ZOOM.min, IMAGE_ZOOM.max, 0.01),
  slider("x", "Position X", -IMAGE_PAN, IMAGE_PAN, 0.01),
  slider("y", "Position Y", -IMAGE_PAN, IMAGE_PAN, 0.01),
  slider("brightness", "Brightness", -0.5, 0.5, 0.01),
  slider("contrast", "Contrast", 0, 2, 0.01),
  slider("saturation", "Saturation", 0, 2, 0.01),
  slider("exposure", "Exposure", -2, 2, 0.01),
  {
    key: "filter",
    label: "Filter",
    type: "select",
    options: ["none", "mono", "sepia", "cool", "warm", "noir", "invert"],
  },
];

/** Your own photo as the base layer. */
export default defineEffect({
  key: "image",
  label: "Image",
  category: "Color",
  blurb: "Your own photo as the base layer.",
  info: "Use a photo as the base; layers above it (like a gradient) can blend over it. Paste from the clipboard or drop an image onto the stage.",
  controls,
  defaults: {
    blur: 0,
    scale: 1,
    x: 0,
    y: 0,
    brightness: 0,
    contrast: 1,
    saturation: 1,
    exposure: 0,
    filter: "none",
  },
  uniforms: (s, ctx) => ({
    uImgOn: ctx.hasImage ? 1 : 0,
    uImgScale: n(s.image.scale) || 1,
    uImgPos: [n(s.image.x), n(s.image.y)],
    uImgBlur: n(s.image.blur),
    uImgBright: n(s.image.brightness),
    uImgContrast: s.image.contrast == null ? 1 : n(s.image.contrast),
    uImgSat: s.image.saturation == null ? 1 : n(s.image.saturation),
    uImgExposure: n(s.image.exposure),
    uImgFilter: opt(controls, "filter", s.image.filter),
  }),
  glsl: /* glsl */ `
uniform float uImgOn;
uniform sampler2D uImg;
uniform vec2 uImgSize;
uniform float uImgScale;
uniform vec2 uImgPos;
uniform float uImgBlur;
uniform float uImgBright;
uniform float uImgContrast;
uniform float uImgSat;
uniform float uImgExposure;
uniform float uImgFilter;

// Cover-fit UV for the photo, with scale and pan.
vec2 imageUv(vec2 p) {
  float a = aspect();
  float ia = uImgSize.x / uImgSize.y;
  vec2 q = (p - uImgPos * vec2(a, 1.0) * 0.5) / uImgScale;
  vec2 uv = a > ia ? vec2(q.x / a, q.y / a * ia) : vec2(q.x / ia, q.y);
  return uv + 0.5;
}

// Mip-based blur, softened with a few taps so it doesn't look blocky.
vec3 imageSample(vec2 uv) {
  if (uImgBlur <= 0.0) return texture(uImg, uv).rgb;
  float lod = uImgBlur * 7.0;
  vec2 d = uImgBlur * 0.015 * vec2(1.0, uImgSize.x / uImgSize.y);
  vec3 c = textureLod(uImg, uv, lod).rgb * 0.36;
  c += textureLod(uImg, uv + vec2(d.x, 0.0), lod).rgb * 0.16;
  c += textureLod(uImg, uv - vec2(d.x, 0.0), lod).rgb * 0.16;
  c += textureLod(uImg, uv + vec2(0.0, d.y), lod).rgb * 0.16;
  c += textureLod(uImg, uv - vec2(0.0, d.y), lod).rgb * 0.16;
  return c;
}

vec3 adjust(vec3 c) {
  c *= exp2(uImgExposure);
  c += uImgBright;
  c = (c - 0.5) * uImgContrast + 0.5;
  c = mix(vec3(luma(c)), c, uImgSat);
  int f = int(uImgFilter + 0.5);
  float l = luma(c);
  if (f == 1) c = vec3(l);
  else if (f == 2) c = vec3(l * 1.07 + 0.05, l * 0.95 + 0.02, l * 0.78);
  else if (f == 3) c *= vec3(0.88, 1.0, 1.18);
  else if (f == 4) c *= vec3(1.15, 1.0, 0.85);
  else if (f == 5) c = vec3(smoothstep(0.25, 0.75, l));
  else if (f == 6) c = 1.0 - c;
  return clamp(c, 0.0, 1.0);
}

void main() {
  vec2 p = fragP();
  vec3 below = inputAt(p);
  vec2 uv = imageUv(p);
  if (uImgOn < 0.5 || uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
    emit(below);
    return;
  }
  emit(adjust(imageSample(uv)));
}
`,
});
