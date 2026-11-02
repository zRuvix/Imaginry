import type { BetterAuthOptions } from "better-auth";
import { Pool } from "pg";

// Kept free of "server-only" so scripts/migrate-auth.ts can load it outside Next.

// One pool per server process; kept on globalThis so dev hot reloads
// don't open a new pool each time.
const globalForPg = globalThis as unknown as { pg?: Pool };

function pool() {
  globalForPg.pg ??= new Pool({ connectionString: process.env.DB_URL, max: 5 });
  return globalForPg.pg;
}

export const authOptions = {
  database: pool(),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      prompt: "select_account",
    },
  },
  session: {
    // Keep the session in a signed cookie for 5 minutes so most checks skip the DB.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
} satisfies BetterAuthOptions;
