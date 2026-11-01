/**
 * The brand mark and wordmark. Three marks live in /public/brand
 * (mark-a "Stack", mark-b "Flute", mark-c "Spark i"); change LOGO_MARK to
 * switch, and copy the same file to app/icon.svg for the favicon.
 */
export const LOGO_MARK = "/brand/mark-a.svg";

export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGO_MARK} alt="" width={size} height={size} className={`shrink-0 ${className ?? ""}`} draggable={false} />
  );
}

/** Mark plus "imaginry" in the display face. */
export function Logo({ size = 24, textClass = "text-[17px]" }: { size?: number; textClass?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} className="transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[-8deg] group-hover:scale-110" />
      <span className={`font-display tracking-tight ${textClass}`}>imaginry</span>
    </span>
  );
}
