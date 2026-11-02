import { ArrayBufferTarget as Mp4Target, Muxer as Mp4Muxer } from "mp4-muxer";
import { ArrayBufferTarget as WebmTarget, Muxer as WebmMuxer } from "webm-muxer";
import { renderOffscreen } from "./renderer";
import type { StudioState } from "./schema";

export type VideoFormat = "mp4" | "webm" | "av1";

export type VideoOptions = {
  state: StudioState;
  image: TexImageSource | null;
  width: number;
  height: number;
  fps: number;
  seconds: number;
  format: VideoFormat;
  /** Animation time the loop starts from, and how fast it advances. */
  startTime: number;
  speed: number;
  /** Studio-preview pixel size in export pixels (see Renderer.render). */
  pixel?: number;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

/** Codec strings per format; the level is bumped for frames above 1080p. */
function codecFor(format: VideoFormat, width: number, height: number) {
  const large = width * height > 1920 * 1088;
  if (format === "mp4") return large ? "avc1.640033" : "avc1.640028";
  if (format === "webm") return large ? "vp09.00.51.08" : "vp09.00.40.08";
  return large ? "av01.0.12M.08" : "av01.0.08M.08";
}

export const VIDEO_MIME: Record<VideoFormat, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  av1: "video/webm",
};

export function videoSupported() {
  return typeof window !== "undefined" && "VideoEncoder" in window;
}

/**
 * Renders the design frame by frame (not in real time) and encodes it with
 * WebCodecs. The last part of the clip cross-fades into its start so the
 * video loops seamlessly.
 */
export async function encodeLoop(o: VideoOptions): Promise<Blob> {
  if (!videoSupported()) throw new Error("This browser can't encode video (WebCodecs is missing).");
  // Encoders need even dimensions.
  const width = o.width & ~1;
  const height = o.height & ~1;
  const codec = codecFor(o.format, width, height);
  const bitrate = Math.round(width * height * o.fps * 0.15);

  const config: VideoEncoderConfig = { codec, width, height, bitrate, framerate: o.fps };
  if (o.format === "mp4") config.avc = { format: "avc" };
  const support = await VideoEncoder.isConfigSupported(config);
  if (!support.supported) {
    throw new Error(`${o.format.toUpperCase()} at ${width}×${height} isn't supported by this browser.`);
  }

  const mp4 =
    o.format === "mp4"
      ? new Mp4Muxer({
          target: new Mp4Target(),
          video: { codec: "avc", width, height, frameRate: o.fps },
          fastStart: "in-memory",
        })
      : null;
  const webm =
    o.format !== "mp4"
      ? new WebmMuxer({
          target: new WebmTarget(),
          video: { codec: o.format === "av1" ? "V_AV1" : "V_VP9", width, height, frameRate: o.fps },
        })
      : null;

  let failure: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => (mp4 ? mp4.addVideoChunk(chunk, meta) : webm!.addVideoChunk(chunk, meta)),
    error: (e) => (failure = e instanceof Error ? e : new Error(String(e))),
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
      const time = o.startTime + t * o.speed;
      ctx.globalAlpha = 1;
      ctx.drawImage(await renderOffscreen(o.state, width, height, { time, image: o.image, pixel: o.pixel }), 0, 0);

      // Fade the tail into the frames just before the start.
      const mix = (t - (o.seconds - fade)) / fade;
      if (mix > 0) {
        const earlier = o.startTime + (t - o.seconds) * o.speed;
        ctx.globalAlpha = mix * mix * (3 - 2 * mix);
        ctx.drawImage(await renderOffscreen(o.state, width, height, { time: earlier, image: o.image, pixel: o.pixel }), 0, 0);
      }

      const vf = new VideoFrame(frame, { timestamp: Math.round(i * frameUs), duration: Math.round(frameUs) });
      encoder.encode(vf, { keyFrame: i % (o.fps * 2) === 0 });
      vf.close();

      while (encoder.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 4));
      if (i % 4 === 0) {
        o.onProgress?.(i / total);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    await encoder.flush();
    if (failure) throw failure;
  } finally {
    if (encoder.state !== "closed") encoder.close();
  }

  o.onProgress?.(1);
  if (mp4) {
    mp4.finalize();
    return new Blob([mp4.target.buffer], { type: VIDEO_MIME.mp4 });
  }
  webm!.finalize();
  return new Blob([webm!.target.buffer], { type: VIDEO_MIME[o.format] });
}
