import { CREATOR, CREATOR_URL } from "@/lib/seo";

/** "Imaginry by @zRuvix1", linking to the maker's X profile. */
export function Credit({ className }: { className?: string }) {
  return (
    <span className={className}>
      Imaginry by{" "}
      <a
        href={CREATOR_URL}
        target="_blank"
        rel="noopener author"
        className="text-current underline decoration-current/30 underline-offset-[3px] transition-colors hover:text-ember hover:decoration-ember"
      >
        {CREATOR}
      </a>
    </span>
  );
}
