/**
 * Animated GIF support for the image layer. The file is decoded here (no
 * library, no network) into fully composited frames, so the renderer can show
 * the frame for any layer time, live on the stage and frame-exact in exports.
 */

/** Keeps decoded frames under this many bytes; longer GIFs drop frames evenly. */
const MAX_BYTES = 320 * 1024 * 1024;

type RawFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  interlaced: boolean;
  palette: Uint8Array;
  transparent: number;
  disposal: number;
  delay: number;
  minCode: number;
  data: Uint8Array;
};

function lzw(minCode: number, data: Uint8Array, size: number) {
  const out = new Uint8Array(size);
  const clear = 1 << minCode;
  const end = clear + 1;
  const prefix = new Int16Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  let codeSize = minCode + 1;
  let next = end + 1;
  let old = -1;
  let first = 0;
  let bits = 0;
  let datum = 0;
  let o = 0;
  for (let i = 0; i < data.length && o < size; ) {
    if (bits < codeSize) {
      datum |= data[i++] << bits;
      bits += 8;
      continue;
    }
    const code = datum & ((1 << codeSize) - 1);
    datum >>= codeSize;
    bits -= codeSize;
    if (code === clear) {
      codeSize = minCode + 1;
      next = end + 1;
      old = -1;
      continue;
    }
    if (code === end) break;
    if (old === -1) {
      out[o++] = suffix[code] = code;
      first = code;
      old = code;
      continue;
    }
    let c = code;
    let sp = 0;
    if (code >= next) {
      stack[sp++] = first;
      c = old;
    }
    while (c >= clear) {
      stack[sp++] = suffix[c];
      c = prefix[c];
    }
    first = c;
    stack[sp++] = c;
    if (next < 4096) {
      prefix[next] = old;
      suffix[next] = first;
      next++;
      if (next === 1 << codeSize && codeSize < 12) codeSize++;
    }
    old = code;
    while (sp > 0 && o < size) out[o++] = stack[--sp];
  }
  return out;
}

function parse(buf: Uint8Array) {
  const sig = String.fromCharCode(...buf.subarray(0, 6));
  if (sig !== "GIF87a" && sig !== "GIF89a") throw new Error("Not a GIF");
  const width = buf[6] | (buf[7] << 8);
  const height = buf[8] | (buf[9] << 8);
  const flags = buf[10];
  let p = 13;
  let global: Uint8Array | null = null;
  if (flags & 0x80) {
    const n = 3 * (1 << ((flags & 7) + 1));
    global = buf.subarray(p, p + n);
    p += n;
  }
  const blocks = () => {
    const parts: Uint8Array[] = [];
    let total = 0;
    while (p < buf.length) {
      const len = buf[p++];
      if (!len) break;
      parts.push(buf.subarray(p, p + len));
      total += len;
      p += len;
    }
    const out = new Uint8Array(total);
    let o = 0;
    for (const part of parts) {
      out.set(part, o);
      o += part.length;
    }
    return out;
  };

  const frames: RawFrame[] = [];
  let gce = { transparent: -1, disposal: 0, delay: 0 };
  while (p < buf.length) {
    const kind = buf[p++];
    if (kind === 0x3b) break; // trailer
    if (kind === 0x21) {
      const label = buf[p++];
      if (label === 0xf9) {
        const packed = buf[p + 1];
        gce = {
          disposal: (packed >> 2) & 7,
          delay: (buf[p + 2] | (buf[p + 3] << 8)) * 10,
          transparent: packed & 1 ? buf[p + 4] : -1,
        };
        p += buf[p] + 1;
        blocks();
      } else blocks();
      continue;
    }
    if (kind !== 0x2c) break; // unknown block: stop with what we have
    const x = buf[p] | (buf[p + 1] << 8);
    const y = buf[p + 2] | (buf[p + 3] << 8);
    const w = buf[p + 4] | (buf[p + 5] << 8);
    const h = buf[p + 6] | (buf[p + 7] << 8);
    const f = buf[p + 8];
    p += 9;
    let palette = global;
    if (f & 0x80) {
      const n = 3 * (1 << ((f & 7) + 1));
      palette = buf.subarray(p, p + n);
      p += n;
    }
    const minCode = buf[p++];
    const data = blocks();
    if (palette && w && h) {
      frames.push({ x, y, w, h, interlaced: !!(f & 0x40), palette, minCode, data, ...gce });
    }
    gce = { transparent: -1, disposal: 0, delay: 0 };
  }
  return { width, height, frames };
}

/** Row order of an interlaced frame: passes at every 8th, 8th+4, 4th+2, 2nd+1 row. */
function interlacedRows(h: number) {
  const rows: number[] = [];
  for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let r = start; r < h; r += step) rows.push(r);
  return rows;
}

export class AnimatedGif {
  readonly animated = true;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Composited frames, each the full GIF size. */
  readonly frames: ImageData[];
  /** When each frame starts, in seconds; the loop is `duration` long. */
  readonly starts: number[];
  readonly duration: number;

  private constructor(src: string, width: number, height: number, frames: ImageData[], delays: number[]) {
    this.src = src;
    this.width = width;
    this.height = height;
    this.frames = frames;
    let t = 0;
    this.starts = delays.map((d) => {
      const s = t;
      t += d;
      return s;
    });
    this.duration = t;
  }

  /** The frame on screen at `time` seconds, looping. */
  indexAt(time: number) {
    if (this.frames.length < 2 || this.duration <= 0) return 0;
    const t = ((time % this.duration) + this.duration) % this.duration;
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.starts[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  static async fromFile(file: File) {
    const { width, height, frames } = parse(new Uint8Array(await file.arrayBuffer()));
    if (!frames.length || !width || !height) throw new Error("Empty GIF");

    // Long GIFs keep every n-th frame (holding each one longer) to stay in memory.
    const step = Math.max(1, Math.ceil((frames.length * width * height * 4) / MAX_BYTES));
    const canvas = new Uint8ClampedArray(width * height * 4);
    const out: ImageData[] = [];
    const delays: number[] = [];
    let held = 0;

    frames.forEach((f, i) => {
      const restore = f.disposal === 3 ? canvas.slice() : null;
      const pixels = lzw(f.minCode, f.data, f.w * f.h);
      const rows = f.interlaced ? interlacedRows(f.h) : null;
      for (let r = 0; r < f.h; r++) {
        const y = f.y + (rows ? rows[r] : r);
        if (y >= height) continue;
        for (let c = 0; c < f.w; c++) {
          const x = f.x + c;
          if (x >= width) continue;
          const idx = pixels[r * f.w + c];
          if (idx === f.transparent) continue;
          const o = (y * width + x) * 4;
          canvas[o] = f.palette[idx * 3];
          canvas[o + 1] = f.palette[idx * 3 + 1];
          canvas[o + 2] = f.palette[idx * 3 + 2];
          canvas[o + 3] = 255;
        }
      }
      // Browsers play delays of 0 or 10 ms at 100 ms; do the same.
      held += f.delay <= 10 ? 100 : f.delay;
      if (i % step === step - 1 || i === frames.length - 1) {
        out.push(new ImageData(canvas.slice(), width, height));
        delays.push(held / 1000);
        held = 0;
      }
      if (f.disposal === 2) {
        for (let r = f.y; r < Math.min(height, f.y + f.h); r++) {
          canvas.fill(0, (r * width + f.x) * 4, (r * width + Math.min(width, f.x + f.w)) * 4);
        }
      } else if (restore) canvas.set(restore);
    });

    return new AnimatedGif(URL.createObjectURL(file), width, height, out, delays);
  }
}

/** What the image layer can hold: a still photo or an animated GIF. */
export type StudioImage = HTMLImageElement | AnimatedGif;

export const isAnimatedGif = (image: unknown): image is AnimatedGif => image instanceof AnimatedGif;
