"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LaunchButton from "@/components/landing/LaunchButton";
import { Logo } from "@/components/Logo";
import { useMyProfile } from "@/lib/useMyProfile";

const LINKS = [
  ["/gallery", "Gallery"],
  ["/explore", "Explore"],
  ["/studio", "Studio"],
] as const;

/** Top bar for Explore and profile pages. */
export default function SiteHeader() {
  const path = usePathname();
  const { user, profile } = useMyProfile();
  return (
    <header className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-5 md:px-6">
      <div className="flex items-center gap-4">
        <Link href="/" aria-label="Imaginry home" className="press group text-bone hover:text-white">
          <Logo size={28} textClass="text-[17px]" />
        </Link>
        <nav aria-label="Site" className="flex gap-0.5 text-[13.5px]">
          {LINKS.map(([href, label]) => {
            const on = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`press rounded-full px-3 py-1.5 ${on ? "bg-white/[0.08] text-bone" : "text-bone/55 hover:text-bone"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {user && profile ? (
          <Link
            href={`/profile/${profile.username}`}
            aria-label="Your profile"
            className="press flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1 pr-3 text-[13px] text-bone/80 hover:bg-white/[0.1] hover:text-bone"
          >
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt="" referrerPolicy="no-referrer" className="size-7 rounded-full object-cover" />
            ) : (
              <span className="grid size-7 place-items-center rounded-full bg-ember/20 text-[12px] text-ember">
                {profile.username.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="hidden sm:inline">@{profile.username}</span>
          </Link>
        ) : null}
        <span className="hidden sm:block">
          <LaunchButton className="h-10 bg-bone px-4 text-[13.5px] text-ink hover:bg-white" iconSize={14} />
        </span>
      </div>
    </header>
  );
}
