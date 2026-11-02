import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { authOptions } from "./auth-options";

// Usernames of accounts being deleted, read before the rows cascade away.
const deleting = new Map<string, string | null>();

export const auth = betterAuth({
  ...authOptions,
  user: {
    ...authOptions.user,
    deleteUser: {
      ...authOptions.user.deleteUser,
      // Imported lazily: profiles.ts imports this file.
      beforeDelete: async (user) => {
        const { usernameOf } = await import("./profiles");
        deleting.set(user.id, await usernameOf(user.id));
      },
      // Their profile page and designs in Explore shouldn't outlive the account in the cache.
      afterDelete: async (user) => {
        const { forgetUser } = await import("./profiles");
        await forgetUser(user.id, deleting.get(user.id) ?? null);
        deleting.delete(user.id);
      },
    },
  },
  plugins: [nextCookies()],
});
