/**
 * Offline video for the Lab: every frame gets its own design (timeline and
 * drive applied), and an optional music track is muxed in alongside.
 */
import { ArrayBufferTarget as Mp4Target, Muxer as Mp4Muxer } from "mp4-muxer";
import { ArrayBufferTarget as WebmTarget, Muxer as WebmMuxer } from "webm-muxer";
import { renderOffscreen } from "@/lib/studio/renderer";
import type { StudioState } from "@/lib/studio/schema";
import { videoSupported } from "@/lib/studio/video";

export type LabFormat = "mp4" | "webm";

export type TakeOptions = {
  /** The design for frame `i` at real time `t` seconds. */
  stateAt: (t: number, i: number) => StudioState;
  /** Effect clock for real time `t`. */
  timeAt: (t: number) => number;
  width: number;
  height: number;
  fps: number;
  seconds: number;
  format: LabFormat;
  pixel: number;
  /** Cross-fade the tail into the start so the clip loops. */
  loop: boolean;
  audio?: AudioBuffer | null;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

export { videoSupported };

function videoCodec(format: LabFormat, w: number, h: number) {
  const large = w * h > 1920 * 1088;
  if (format === "mp4") return large ? "avc1.640033" : "avc1.640028";
  return large ? "vp09.00.51.08" : "vp09.00.40.08";
}

const AUDIO_RATE = 48000;

/** Resamples to 48 kHz stereo, what both AAC and Opus encoders accept. */
async function toEncoderRate(buffer: AudioBuffer) {
  if (buffer.sampleRate === AUDIO_RATE && buffer.numberOfChannels === 2) return buffer;
  const ctx = new OfflineAudioContext(2, Math.ceil(buffer.duration * AUDIO_RATE), AUDIO_RATE);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
  return ctx.startRendering();
}

export async function encodeTake(o: TakeOptions): Promise<Blob> {
  if (!videoSupported()) throw new Error("This browser can't encode video (WebCodecs is missing).");
  const width = o.width & ~1;
  const height = o.height & ~1;
  const config: VideoEncoderConfig = {
    codec: videoCodec(o.format, width, height),
    width,
    height,
    bitrate: Math.round(width * height * o.fps * 0.15),
    framerate: o.fps,
  };
  if (o.format === "mp4") config.avc = { format: "avc" };
  if (!(await VideoEncoder.isConfigSupported(config)).supported) {
    throw new Error(`${o.format.toUpperCase()} at ${width}×${height} isn't supported by this browser.`);
  }

  // Audio goes in only if this browser can encode it.
  let audio: AudioBuffer | null = null;
  let audioConfig: AudioEncoderConfig | null = null;
  if (o.audio && "AudioEncoder" in window) {
    const candidate: AudioEncoderConfig = {
      codec: o.format === "mp4" ? "mp4a.40.2" : "opus",
      sampleRate: AUDIO_RATE,
      numberOfChannels: 2,
      bitrate: 192_000,
    };
    if ((await AudioEncoder.isConfigSupported(candidate)).supported) {
      audio = await toEncoderRate(o.audio);
      audioConfig = candidate;
    }
  }

  const audioTrack = audioConfig ? { numberOfChannels: 2, sampleRate: AUDIO_RATE } : undefined;
  const mp4 =
    o.format === "mp4"
      ? new Mp4Muxer({
          target: new Mp4Target(),
          video: { codec: "avc", width, height, frameRate: o.fps },
          audio: audioTrack && { codec: "aac", ...audioTrack },
          fastStart: "in-memory",
        })
      : null;
  const webm =
    o.format === "webm"
      ? new WebmMuxer({
          target: new WebmTarget(),
          video: { codec: "V_VP9", width, height, frameRate: o.fps },
          audio: audioTrack && { codec: "A_OPUS", ...audioTrack },
        })
      : null;

  let failure: Error | null = null;
  const fail = (e: unknown) => (failure = e instanceof Error ? e : new Error(String(e)));
  const encoder = new VideoEncoder({
    output: (chunk, meta) => (mp4 ? mp4.addVideoChunk(chunk, meta) : webm!.addVideoChunk(chunk, meta)),
    error: fail,
  });
  encoder.configure(config);

  const frame = document.createElement("canvas");
  frame.width = width;
  frame.height = height;
  const ctx = frame.getContext("2d")!;
  const total = Math.round(o.fps * o.seconds);
  const fade = Math.min(1, o.seconds / 3);
  const frameUs = 1_000_000 / o.fps;

  try {
    for (let i = 0; i < total; i++) {
      if (o.signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
      if (failure) throw failure;
      const t = i / o.fps;
      const state = o.stateAt(t, i);
      ctx.globalAlpha = 1;
      ctx.drawImage(await renderOffscreen(state, width, height, { time: o.timeAt(t), pixel: o.pixel }), 0, 0);
      if (o.loop) {
        // Same design, effect clock from one loop earlier, faded in over the tail.
        const m = (t - (o.seconds - fade)) / fade;
        if (m > 0) {
          ctx.globalAlpha = m * m * (3 - 2 * m);
          ctx.drawImage(await renderOffscreen(state, width, height, { time: o.timeAt(t - o.seconds), pixel: o.pixel }), 0, 0);
        }
      }
      const vf = new VideoFrame(frame, { timestamp: Math.round(i * frameUs), duration: Math.round(frameUs) });
      encoder.encode(vf, { keyFrame: i % (o.fps * 2) === 0 });
      vf.close();
      while (encoder.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 4));
      if (i % 4 === 0) {
        o.onProgress?.((i / total) * (audio ? 0.95 : 1));
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    await encoder.flush();
    if (failure) throw failure;
  } finally {
    if (encoder.state !== "closed") encoder.close();
  }

  if (audio && audioConfig) {
    const aenc = new AudioEncoder({
      output: (chunk, meta) => (mp4 ? mp4.addAudioChunk(chunk, meta) : webm!.addAudioChunk(chunk, meta)),
      error: fail,
    });
    aenc.configure(audioConfig);
    const length = Math.min(audio.length, Math.round(o.seconds * AUDIO_RATE));
    const left = audio.getChannelData(0);
    const right = audio.getChannelData(1);
    const CHUNK = 4800;
    try {
      for (let at = 0; at < length; at += CHUNK) {
        const n = Math.min(CHUNK, length - at);
        const data = new Float32Array(n * 2);
        data.set(left.subarray(at, at + n), 0);
        data.set(right.subarray(at, at + n), n);
        const ad = new AudioData({
          format: "f32-planar",
          sampleRate: AUDIO_RATE,
          numberOfFrames: n,
          numberOfChannels: 2,
          timestamp: Math.round((at / AUDIO_RATE) * 1_000_000),
          data,
        });
        aenc.encode(ad);
        ad.close();
      }
      await aenc.flush();
      if (failure) throw failure;
    } finally {
      if (aenc.state !== "closed") aenc.close();
    }
  }

  o.onProgress?.(1);
  if (mp4) {
    mp4.finalize();
    return new Blob([mp4.target.buffer], { type: "video/mp4" });
  }
  webm!.finalize();
  return new Blob([webm!.target.buffer], { type: "video/webm" });
}

// ---------------------------------------------------------------- offline audio analysis

export type BandFrames = { low: Float32Array; mid: Float32Array; high: Float32Array };

/**
 * Low (<250 Hz), mid (250–2000 Hz) and high (>2 kHz) energy for every video
 * frame, 0..1, from one-pole filters over the whole track.
 */
export function analyseBands(buffer: AudioBuffer, fps: number, frames: number): BandFrames {
  const rate = buffer.sampleRate;
  const n = buffer.length;
  const mono = new Float32Array(n);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) mono[i] += d[i] / buffer.numberOfChannels;
  }
  const alpha = (hz: number) => 1 - Math.exp((-2 * Math.PI * hz) / rate);
  const a1 = alpha(250);
  const a2 = alpha(2000);
  const out: BandFrames = { low: new Float32Array(frames), mid: new Float32Array(frames), high: new Float32Array(frames) };
  const per = rate / fps;
  let lp1 = 0;
  let lp2 = 0;
  for (let f = 0; f < frames; f++) {
    const start = Math.floor(f * per);
    const end = Math.min(n, Math.floor((f + 1) * per));
    let el = 0;
    let em = 0;
    let eh = 0;
    for (let i = start; i < end; i++) {
      const x = mono[i];
      lp1 += a1 * (x - lp1);
      lp2 += a2 * (x - lp2);
      el += lp1 * lp1;
      em += (lp2 - lp1) * (lp2 - lp1);
      eh += (x - lp2) * (x - lp2);
    }
    const len = Math.max(1, end - start);
    out.low[f] = Math.sqrt(el / len);
    out.mid[f] = Math.sqrt(em / len);
    out.high[f] = Math.sqrt(eh / len);
  }
  // Normalise each band to its loud passages (98th percentile), not the single peak.
  for (const band of [out.low, out.mid, out.high]) {
    const sorted = Float32Array.from(band).sort();
    const ref = sorted[Math.floor(sorted.length * 0.98)] || 1;
    for (let i = 0; i < band.length; i++) band[i] = Math.min(1, band[i] / ref);
  }
  return out;
}

export async function decodeAudio(file: Blob) {
  const ctx = new AudioContext();
  try {
    return await ctx.decodeAudioData(await file.arrayBuffer());
  } finally {
    ctx.close();
  }
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
