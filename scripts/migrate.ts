/**
 * Creates or updates every table in the database at DB_URL: the auth tables
 * (user, session, account, verification) and the app's own (profile, design).
 * Safe to re-run: only missing tables, columns and indexes are added.
 *
 *   pnpm db:migrate
 */
import { getMigrations } from "better-auth/db/migration";
import { authOptions } from "../lib/server/auth-options.ts";

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(authOptions);
if (!toBeCreated.length && !toBeAdded.length) {
  console.log("Auth tables are up to date.");
} else {
  console.log("Creating:", toBeCreated.map((t) => t.table).join(", ") || "none");
  console.log("Adding columns to:", toBeAdded.map((t) => t.table).join(", ") || "none");
  await runMigrations();
}

// Public profile and shared designs. Rows go away with the user (account deletion).
await authOptions.database.query(`
  create table if not exists profile (
    user_id     text primary key references "user"(id) on delete cascade,
    username    text not null,
    first_name  text,
    last_name   text,
    socials     jsonb not null default '{}'::jsonb,
    is_public   boolean not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
  );
  create unique index if not exists profile_username_key on profile (lower(username));

  create table if not exists design (
    id          text primary key,
    user_id     text not null references "user"(id) on delete cascade,
    title       text not null,
    data        text not null,
    created_at  timestamptz not null default now()
  );
  create index if not exists design_created_idx on design (created_at desc);
  create index if not exists design_user_idx on design (user_id, created_at desc);
`);
console.log("App tables are up to date.");
await authOptions.database.end();
