/**
 * Creates or updates the auth tables (user, session, account, verification)
 * in the database at DB_URL. Safe to re-run: only missing tables/columns are added.
 *
 *   node --env-file=.env.local scripts/migrate-auth.ts
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
  console.log("Done.");
}
await authOptions.database.end();
