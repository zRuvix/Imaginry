import type { Metadata } from "next";
import Link from "next/link";
import { HeroSky } from "@/components/landing/HeroSky";
import Navbar from "@/components/landing/Navbar";

export const metadata: Metadata = {
  title: "404 · Page not found",
  description: "The page you’re looking for may have moved or been removed.",
};

export default function NotFound() {
  return (
    <main className="min-h-full bg-[#eef1f3] p-2 [color-scheme:light]">
      <section className="relative isolate flex min-h-[max(460px,calc(100svh-16px))] flex-col overflow-clip rounded-[24px] bg-[#dce9f3] sm:rounded-[28px]">
        <HeroSky />
        <Navbar />

        <div className="relative flex flex-1 flex-col items-center justify-center px-5 pb-[clamp(4rem,20svh,12rem)] pt-8 text-center text-[#121416]">
          <h1 className="font-lexend flex flex-col items-center gap-3 font-light">
            <span className="text-[clamp(5.5rem,min(20vw,22svh),13rem)] leading-[0.9] tracking-[-0.075em]">404</span>
            <span className="text-[clamp(1.6rem,4.5vw,3.5rem)] leading-tight tracking-[-0.045em]">Page not found</span>
          </h1>
          <p className="font-outfit mt-3 max-w-[36ch] text-[15px] leading-relaxed text-[#3a3d40] xl:text-[17px]">
            The page you’re looking for may have moved or been removed.
          </p>
          <Link
            href="/"
            className="blue-button blue-button-large mt-6"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
