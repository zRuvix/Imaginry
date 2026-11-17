import "server-only";
import { existsSync } from "node:fs";
import type { Browser } from "puppeteer-core";

/**
 * Server-side PNG rendering. Designs are WebGL2 shaders, so a headless
 * Chromium (software WebGL via SwiftShader) opens the internal /render page,
 * which draws the design with the studio's own renderer and hands back the PNG.
 * On Vercel the browser comes from @sparticuz/chromium; locally from
 * CHROME_PATH or a standard Chrome/Brave install.
 */

export const PNG_MAX_SIDE = 2048;
export const PNG_MIN_SIDE = 64;
const RENDER_TIMEOUT_MS = 45_000;

const LOCAL_BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

// One browser per server instance, reused across requests.
const globalForBrowser = globalThis as unknown as { imaginryBrowser?: Promise<Browser> };

async function launch(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  }
  const executablePath = process.env.CHROME_PATH ?? LOCAL_BROWSERS.find((p) => existsSync(p));
  if (!executablePath) throw new Error("No Chrome found for PNG rendering; set CHROME_PATH");
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", "--no-default-browser-check"],
  });
}

function browser(): Promise<Browser> {
  const existing = globalForBrowser.imaginryBrowser;
  if (existing) return existing;
  const started = launch().then((b) => {
    b.on("disconnected", () => {
      if (globalForBrowser.imaginryBrowser === started) globalForBrowser.imaginryBrowser = undefined;
    });
    return b;
  });
  started.catch(() => {
    globalForBrowser.imaginryBrowser = undefined;
  });
  globalForBrowser.imaginryBrowser = started;
  return started;
}

export type PngSize = { width: number; height: number };

/** Clamps a requested size into what the renderer accepts, keeping its shape. */
export function fitSize(width: number, height: number): PngSize {
  const w = Math.round(Number(width) || 1600);
  const h = Math.round(Number(height) || 1000);
  const scale = Math.min(1, PNG_MAX_SIDE / Math.max(w, h));
  return {
    width: Math.max(PNG_MIN_SIDE, Math.round(w * scale)),
    height: Math.max(PNG_MIN_SIDE, Math.round(h * scale)),
  };
}

/** Renders a compact design string to PNG bytes. `origin` is this site's own base URL. */
export async function renderPng(origin: string, design: string, size: PngSize, time = 0): Promise<Buffer> {
  const b = await browser();
  const page = await b.newPage();
  try {
    await page.setViewport({ width: 320, height: 240 });
    const url = `${origin}/render?w=${size.width}&h=${size.height}&t=${time}#${design}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: RENDER_TIMEOUT_MS });
    await page.waitForFunction(() => window.__imaginryRender !== undefined, { timeout: RENDER_TIMEOUT_MS });
    const result = await page.evaluate(() => window.__imaginryRender!);
    if (!result.ok) throw new Error(result.error);
    return Buffer.from(result.png, "base64");
  } finally {
    await page.close().catch(() => {});
  }
}
