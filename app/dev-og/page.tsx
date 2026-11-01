"use client";
// Temporary: renders the social cards from real looks and saves them. Deleted after.
import { useEffect, useRef, useState } from "react";
import { CURATED, GALLERY, stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { renderOffscreen } from "@/lib/studio/renderer";
import { LOGO_MARK } from "@/components/Logo";

const W = 1200;
const H = 630;
const find = (name: string) => [...CURATED, ...GALLERY].find((l) => l.name === name)!;

type Card = { name: string; look: string; kicker: string; title: string; sub: string; tiles?: string[] };
const CARDS: Card[] = [
  { name: "home", look: "Ember Reeds", kicker: "Free WebGL studio", title: "Backgrounds that\nmove.", sub: "Stack 51 live effects. Export PNG, MP4 or embed code." },
  { name: "studio", look: "Oil Slick", kicker: "Studio", title: "Layer it. Loop it.\nShip it.", sub: "Gradients, glass, grain and 48 more effects in your browser." },
  { name: "gallery", look: "Cobalt Bloom", kicker: "Gallery", title: "36 looks,\nready to remix.", sub: "Open any design in the studio and make it yours.", tiles: ["Sunday Matinee", "Neon Contour", "Marble Hall", "Riso Print"] },
  { name: "sponsor", look: "Gold Dust", kicker: "Sponsor", title: "Put your brand\nin the studio.", sub: "Weekly or monthly slots, seen by designers every day." },
];

async function lookCanvas(look: CuratedLook, w: number, h: number) {
  return renderOffscreen(stateForLook(look), w, h, { time: look.time ?? 2, detail: 900 / Math.min(w, h) });
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

async function loadImg(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function fontOf(cls: string) {
  const el = document.createElement("span");
  el.className = cls;
  document.body.appendChild(el);
  const f = getComputedStyle(el).fontFamily;
  el.remove();
  return f;
}

async function drawCard(card: Card) {
  const display = fontOf("font-display");
  const sans = fontOf("font-sans");
  const condensed = fontOf("font-condensed");
  await document.fonts.load(`80px ${display}`);
  await document.fonts.load(`30px ${sans}`);
  await document.fonts.load(`600 22px ${condensed}`);

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(await lookCanvas(find(card.look), W, H), 0, 0);

  // Legibility veil: dark from the left and bottom.
  let g = ctx.createLinearGradient(0, 0, W * 0.75, 0);
  g.addColorStop(0, "rgba(13,12,11,0.82)");
  g.addColorStop(0.55, "rgba(13,12,11,0.45)");
  g.addColorStop(1, "rgba(13,12,11,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  g = ctx.createLinearGradient(0, H * 0.45, 0, H);
  g.addColorStop(0, "rgba(13,12,11,0)");
  g.addColorStop(1, "rgba(13,12,11,0.6)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (card.tiles) {
    const tw = 200, th = 250, gap = 18;
    const x0 = W - 72 - tw * 2 - gap;
    for (let i = 0; i < card.tiles.length; i++) {
      const x = x0 + (i % 2) * (tw + gap);
      const y = 56 + Math.floor(i / 2) * (th + gap) + (i % 2 ? 36 : 0);
      const tile = await lookCanvas(find(card.tiles[i]), tw * 2, th * 2);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;
      rr(ctx, x, y, tw, th, 22);
      ctx.fillStyle = "#171512";
      ctx.fill();
      ctx.restore();
      ctx.save();
      rr(ctx, x, y, tw, th, 22);
      ctx.clip();
      ctx.drawImage(tile, x, y, tw, th);
      ctx.restore();
    }
  }

  // Brand row.
  const mark = await loadImg(LOGO_MARK);
  ctx.drawImage(mark, 72, 64, 56, 56);
  ctx.fillStyle = "#ede7dc";
  ctx.font = `34px ${display}`;
  ctx.textBaseline = "middle";
  ctx.fillText("imaginry", 144, 93);

  // Kicker pill.
  ctx.font = `600 22px ${condensed}`;
  const kw = ctx.measureText(card.kicker.toUpperCase()).width;
  rr(ctx, 72, 262, kw + 36, 40, 20);
  ctx.fillStyle = "#ff5a2c";
  ctx.fill();
  ctx.fillStyle = "#0d0c0b";
  ctx.fillText(card.kicker.toUpperCase(), 90, 283);

  // Headline.
  ctx.fillStyle = "#ede7dc";
  ctx.font = `66px ${display}`;
  ctx.textBaseline = "alphabetic";
  card.title.split("\n").forEach((line, i) => ctx.fillText(line, 70, 386 + i * 74));

  ctx.font = `27px ${sans}`;
  ctx.fillStyle = "rgba(237,231,220,0.78)";
  ctx.fillText(card.sub, 72, 548);

  ctx.font = `600 22px ${condensed}`;
  ctx.fillStyle = "rgba(237,231,220,0.6)";
  if (!card.tiles) {
    ctx.textAlign = "right";
    ctx.fillText("imaginry.tech", W - 72, 586);
    ctx.textAlign = "left";
  }
  return c;
}

async function appleIcon() {
  const c = document.createElement("canvas");
  c.width = c.height = 180;
  c.getContext("2d")!.drawImage(await loadImg(LOGO_MARK), 0, 0, 180, 180);
  return c;
}

async function save(name: string, canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  await fetch(`/api/dev-og?name=${name}`, { method: "POST", body: blob });
}

export default function DevOg() {
  const [urls, setUrls] = useState<string[]>([]);
  const [status, setStatus] = useState("rendering");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const out: string[] = [];
      for (const card of CARDS) {
        const c = await drawCard(card);
        await save(card.name, c);
        out.push(c.toDataURL("image/jpeg", 0.7));
        setUrls([...out]);
      }
      await save("apple-icon", await appleIcon());
      setStatus("done");
    })().catch((e) => setStatus(String(e)));
  }, []);
  return (
    <div className="min-h-screen bg-ink p-6 text-bone">
      <p id="status">{status}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {urls.map((u) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={u.slice(-40)} src={u} alt="" className="w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
