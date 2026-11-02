/** Profile rules shared by the editor (client) and the API (server). */

export const SOCIALS = [
  { key: "x", label: "X", hosts: ["x.com", "twitter.com"], base: "https://x.com/", placeholder: "@handle" },
  { key: "instagram", label: "Instagram", hosts: ["instagram.com"], base: "https://instagram.com/", placeholder: "@handle" },
  { key: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"], base: "https://www.linkedin.com/in/", placeholder: "linkedin.com/in/you" },
  { key: "github", label: "GitHub", hosts: ["github.com"], base: "https://github.com/", placeholder: "username" },
  { key: "youtube", label: "YouTube", hosts: ["youtube.com"], base: "https://www.youtube.com/@", placeholder: "@channel" },
  { key: "dribbble", label: "Dribbble", hosts: ["dribbble.com"], base: "https://dribbble.com/", placeholder: "username" },
  { key: "behance", label: "Behance", hosts: ["behance.net"], base: "https://www.behance.net/", placeholder: "username" },
  { key: "website", label: "Website", hosts: [], base: "https://", placeholder: "yoursite.com" },
] as const;

export type SocialKey = (typeof SOCIALS)[number]["key"];
export type Socials = Partial<Record<SocialKey, string>>;

export type Profile = {
  username: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  socials: Socials;
  isPublic: boolean;
};

export type SharedDesign = {
  id: string;
  title: string;
  /** Compact share string (see lib/studio/storage); never contains an image. */
  data: string;
  createdAt: string;
  username: string;
  image: string | null;
};

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const NAME_MAX = 40;
export const TITLE_MAX = 60;

/** Words that would clash with site routes or look official. */
const RESERVED = new Set([
  "admin", "api", "app", "about", "auth", "edit", "explore", "gallery", "help", "imaginry", "login", "logout",
  "me", "new", "privacy", "profile", "root", "settings", "signin", "signup", "sponsor", "studio", "support",
  "system", "terms", "www",
]);

/** Lowercase letters, numbers, "_" and "."; starts and ends with a letter or number. */
export function usernameError(name: string): string | null {
  if (name.length < USERNAME_MIN) return `At least ${USERNAME_MIN} characters`;
  if (name.length > USERNAME_MAX) return `At most ${USERNAME_MAX} characters`;
  if (!/^[a-z0-9._]+$/.test(name)) return "Use lowercase letters, numbers, _ and . only";
  if (!/^[a-z0-9].*[a-z0-9]$/.test(name)) return "Start and end with a letter or number";
  if (name.includes("..")) return "No double dots";
  if (RESERVED.has(name)) return "That username is reserved";
  return null;
}

/**
 * Turns a handle or link into a full https URL on the expected site, or
 * returns an error. Empty input clears the link.
 */
export function normalizeSocial(key: SocialKey, input: string): { url: string | null } | { error: string } {
  const social = SOCIALS.find((s) => s.key === key)!;
  const raw = input.trim();
  if (!raw) return { url: null };
  if (raw.length > 200) return { error: "Too long" };

  // "@jane.doe" is a handle even with a dot; "jane.com" or "x.com/jane" are links.
  const looksLikeUrl = !raw.startsWith("@") && (raw.includes("/") || raw.includes("."));
  let url: URL;
  try {
    if (looksLikeUrl) url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    else {
      const handle = raw.replace(/^@/, "");
      if (!/^[\w.-]{1,60}$/.test(handle)) return { error: "That doesn’t look like a handle" };
      url = new URL(`${social.base}${handle}`);
    }
  } catch {
    return { error: "That doesn’t look like a link" };
  }
  url.protocol = "https:";
  const host = url.hostname.replace(/^www\./, "");
  if (social.hosts.length && !social.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
    return { error: `Enter a ${social.label} link or handle` };
  }
  if (!social.hosts.length && !host.includes(".")) return { error: "That doesn’t look like a link" };
  return { url: url.toString() };
}

/** Shown on profiles and cards: the chosen name, else the username. */
export function displayName(p: Pick<Profile, "username" | "firstName" | "lastName">) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.username;
}
