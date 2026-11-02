import "server-only";
import {
  NAME_MAX,
  normalizeSocial,
  SOCIALS,
  TITLE_MAX,
  usernameError,
  type Profile,
  type SharedDesign,
  type Socials,
} from "@/lib/profile";
import { decodeShare, encodeShare } from "@/lib/studio/storage";
import { pool } from "./auth-options";
import { auth } from "./auth";
import { cached, invalidate } from "./cache";

const db = () => pool();

/** Cache keys and lifetimes. Every write below clears the keys it affects. */
const keys = {
  me: (userId: string) => `me:${userId}`,
  profile: (username: string) => `profile:${username.toLowerCase()}`,
  feed: (before: string | null) => `feed:${before ?? "first"}`,
};
const PROFILE_TTL = 300;
const FEED_TTL = 60;

/** The signed-in user for a request, or null. */
export async function currentUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

type ProfileRow = {
  user_id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  socials: Socials;
  is_public: boolean;
  image: string | null;
};

const toProfile = (r: ProfileRow): Profile => ({
  username: r.username,
  firstName: r.first_name,
  lastName: r.last_name,
  image: r.image,
  socials: r.socials ?? {},
  isPublic: r.is_public,
});

const PROFILE_SELECT = `
  select p.user_id, p.username, p.first_name, p.last_name, p.socials, p.is_public, u.image
  from profile p join "user" u on u.id = p.user_id`;

/** A first username from the email, e.g. "jane.doe" or "jane.doe4821" if taken. */
function baseUsername(email: string) {
  let name = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 24);
  if (name.length < 3 || usernameError(name)) name = `user${name}`.slice(0, 24);
  return name.length >= 3 ? name : "user";
}

async function loadOrCreateProfile(user: { id: string; email: string }): Promise<Profile> {
  const existing = await db().query<ProfileRow>(`${PROFILE_SELECT} where p.user_id = $1`, [user.id]);
  if (existing.rows[0]) return toProfile(existing.rows[0]);

  const base = baseUsername(user.email);
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    // Insert and read back in one round trip.
    const r = await db().query<ProfileRow>(
      `with ins as (
         insert into profile (user_id, username) values ($1, $2) on conflict do nothing returning *
       )
       select ins.user_id, ins.username, ins.first_name, ins.last_name, ins.socials, ins.is_public, u.image
       from ins join "user" u on u.id = ins.user_id`,
      [user.id, candidate],
    );
    if (r.rows[0]) return toProfile(r.rows[0]);
  }
  throw new Error("Could not create profile");
}

/** Returns the user's profile, creating one with a generated username on first use. */
export function ensureProfile(user: { id: string; email: string }): Promise<Profile> {
  return cached(keys.me(user.id), PROFILE_TTL, () => loadOrCreateProfile(user));
}

export type ProfileUpdate = {
  username?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  socials?: unknown;
  isPublic?: unknown;
};

/** Validates and saves profile edits. Returns field errors instead of saving when any are invalid. */
export async function updateProfile(
  userId: string,
  input: ProfileUpdate,
): Promise<{ profile: Profile } | { errors: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
  const nameError = usernameError(username);
  if (nameError) errors.username = nameError;

  const cleanName = (v: unknown, field: string) => {
    const s = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
    if (s.length > NAME_MAX) errors[field] = `At most ${NAME_MAX} characters`;
    return s || null;
  };
  const firstName = cleanName(input.firstName, "firstName");
  const lastName = cleanName(input.lastName, "lastName");

  const socials: Socials = {};
  const rawSocials = (input.socials && typeof input.socials === "object" ? input.socials : {}) as Record<string, unknown>;
  for (const s of SOCIALS) {
    const value = rawSocials[s.key];
    if (typeof value !== "string" || !value.trim()) continue;
    const result = normalizeSocial(s.key, value);
    if ("error" in result) errors[`socials.${s.key}`] = result.error;
    else if (result.url) socials[s.key] = result.url;
  }

  if (Object.keys(errors).length) return { errors };

  let row: (ProfileRow & { old_username: string }) | undefined;
  try {
    // Update and read back (with the previous username, for cache keys) in one round trip.
    const r = await db().query<ProfileRow & { old_username: string }>(
      `with old as (select username from profile where user_id = $1),
       upd as (
         update profile set username = $2, first_name = $3, last_name = $4, socials = $5, is_public = $6,
           updated_at = now()
         where user_id = $1 returning *
       )
       select upd.user_id, upd.username, upd.first_name, upd.last_name, upd.socials, upd.is_public, u.image,
              old.username as old_username
       from upd join "user" u on u.id = upd.user_id cross join old`,
      [userId, username, firstName, lastName, JSON.stringify(socials), input.isPublic !== false],
    );
    row = r.rows[0];
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { errors: { username: "That username is taken" } };
    throw e;
  }
  if (!row) return { errors: { form: "Profile not found" } };
  // Name, visibility and username all show up on the profile page and in Explore.
  await invalidate(keys.me(userId), keys.profile(row.old_username), keys.profile(row.username), keys.feed(null));
  return { profile: toProfile(row) };
}

type DesignRow = { id: string; title: string; data: string; created_at: Date | string; username: string; image: string | null };

const toDesign = (r: DesignRow): SharedDesign => ({
  id: r.id,
  title: r.title,
  data: r.data,
  createdAt: new Date(r.created_at).toISOString(),
  username: r.username,
  image: r.image,
});

const DESIGN_SELECT = `
  select d.id, d.title, d.data, d.created_at, p.username, u.image
  from design d join profile p on p.user_id = d.user_id join "user" u on u.id = d.user_id`;

type ProfileRecord = { userId: string; profile: Profile; designs: SharedDesign[] };

/** A profile and all its designs in a single query. */
async function loadProfileRecord(username: string): Promise<ProfileRecord | null> {
  const r = await db().query<ProfileRow & { designs: DesignRow[] }>(
    `select p.user_id, p.username, p.first_name, p.last_name, p.socials, p.is_public, u.image,
       coalesce((
         select json_agg(d order by d.created_at desc) from (
           select id, title, data, created_at, p.username, u.image
           from design where user_id = p.user_id order by created_at desc limit 200
         ) d
       ), '[]') as designs
     from profile p join "user" u on u.id = p.user_id
     where lower(p.username) = lower($1)`,
    [username],
  );
  const row = r.rows[0];
  if (!row) return null;
  return { userId: row.user_id, profile: toProfile(row), designs: row.designs.map(toDesign) };
}

/** A public profile with its designs, or just `private` when the viewer can't see it. */
export async function profilePage(username: string, viewerId: string | null) {
  let record = await cached(keys.profile(username), PROFILE_TTL, () => loadProfileRecord(username));
  if (!record) return null;
  const isOwner = record.userId === viewerId;
  // Owners always get a fresh read, so their own edits show up immediately.
  if (isOwner) record = (await loadProfileRecord(username)) ?? record;
  if (!record.profile.isPublic && !isOwner) return { private: true as const, username: record.profile.username };
  return { private: false as const, isOwner, profile: record.profile, designs: record.designs };
}

export const FEED_PAGE = 24;

/** Newest designs from public profiles, paged by creation time. */
export function exploreFeed(before: string | null) {
  const cursor = before && !Number.isNaN(Date.parse(before)) ? new Date(before).toISOString() : null;
  return cached(keys.feed(cursor), FEED_TTL, async () => {
    const r = await db().query<DesignRow>(
      `${DESIGN_SELECT} where p.is_public and ($1::timestamptz is null or d.created_at < $1)
       order by d.created_at desc limit ${FEED_PAGE}`,
      [cursor],
    );
    return r.rows.map(toDesign);
  });
}

const MAX_DESIGNS_PER_USER = 200;
const ID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Stores a design for Explore. The photo layer is always dropped, so only
 * effect and layer settings are ever kept.
 */
export async function publishDesign(
  userId: string,
  title: unknown,
  design: unknown,
): Promise<{ design: SharedDesign } | { error: string }> {
  if (typeof design !== "string" || !design || design.length > 4000) return { error: "Invalid design" };
  const state = decodeShare(`#${design}`);
  if (!state) return { error: "Invalid design" };
  state.order = state.order.filter((k) => k !== "image");
  state.sections.image = { ...state.sections.image, enabled: false };
  if (!state.order.length) return { error: "Add at least one effect layer before publishing" };

  const cleanTitle = (typeof title === "string" ? title.trim().replace(/\s+/g, " ") : "").slice(0, TITLE_MAX) || "Untitled";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const id = Array.from(bytes, (b) => ID_ALPHABET[b % 62]).join("");

  // Limit check, insert and read-back in one round trip; no row means the limit was hit.
  const r = await db().query<DesignRow>(
    `with ins as (
       insert into design (id, user_id, title, data)
       select $1, $2, $3, $4 where (select count(*) from design where user_id = $2) < $5
       returning *
     )
     select ins.id, ins.title, ins.data, ins.created_at, p.username, u.image
     from ins join profile p on p.user_id = ins.user_id join "user" u on u.id = ins.user_id`,
    [id, userId, cleanTitle, encodeShare(state), MAX_DESIGNS_PER_USER],
  );
  const row = r.rows[0];
  if (!row) return { error: `You can publish up to ${MAX_DESIGNS_PER_USER} designs` };
  await invalidate(keys.profile(row.username), keys.feed(null));
  return { design: toDesign(row) };
}

/** Removes one of the user's own designs. */
export async function deleteDesign(userId: string, id: string) {
  const r = await db().query<{ username: string }>(
    `delete from design d using profile p
     where d.id = $1 and d.user_id = $2 and p.user_id = d.user_id
     returning p.username`,
    [id, userId],
  );
  if (!r.rows[0]) return false;
  await invalidate(keys.profile(r.rows[0].username), keys.feed(null));
  return true;
}

/** Clears everything cached about a user; called when their account is deleted. */
export async function forgetUser(userId: string, username: string | null) {
  await invalidate(keys.me(userId), keys.feed(null), ...(username ? [keys.profile(username)] : []));
}

/** The user's current username straight from the database (no cache). */
export async function usernameOf(userId: string) {
  const r = await db().query<{ username: string }>(`select username from profile where user_id = $1`, [userId]);
  return r.rows[0]?.username ?? null;
}
