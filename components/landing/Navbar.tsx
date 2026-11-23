"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import MobileMenu from "./MobileMenu";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/explore", label: "Explore" },
  { href: "/agents", label: "Agents" },
  { href: "/sponsor", label: "Sponsor" },
];

/** Logo left, a white pill of text links centred, one CTA right; a sidebar menu below md. */
export default function Navbar() {
  const pathname = usePathname();
  // A link is current on its own page and pages under it, so /sponsor-terms doesn't light up Sponsor.
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="relative z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6 xl:px-10 xl:pt-8">
      <Link href="/" className="group inline-flex items-center gap-2 text-[#141414]" aria-label="imaginry home">
        <LogoMark size={26} />
        <span className="font-outfit text-[17px] font-medium xl:text-[20px] tracking-tight">imaginry</span>
      </Link>

      <nav
        aria-label="Main"
        className="absolute left-1/2 top-5 hidden -translate-x-1/2 xl:top-7 items-center gap-0.5 rounded-[14px] bg-white/90 p-1 xl:rounded-[16px] xl:p-1.5 shadow-[0_1px_2px_rgba(20,30,40,0.06),0_8px_24px_-12px_rgba(20,30,40,0.18)] backdrop-blur-md sm:top-6 md:flex"
      >
        {LINKS.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`font-outfit rounded-[10px] px-3.5 py-1.5 text-[13.5px] transition-colors xl:rounded-[11px] xl:px-5 xl:py-2 xl:text-[15.5px] duration-200 ${
                active ? "blue-button" : "text-[#3a3d40] hover:bg-black/[0.05] hover:text-[#141414]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
      <Link
        href="/studio"
        className="blue-button font-outfit hidden min-h-9 items-center justify-center rounded-[11px] px-4 text-[13.5px] font-semibold sm:inline-flex xl:min-h-11 xl:px-6 xl:text-[15.5px]"
      >
        Open studio
      </Link>
      <MobileMenu links={LINKS} isActive={isActive} />
      </div>
    </header>
  );
}
