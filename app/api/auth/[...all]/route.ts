import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/server/auth";

/** Sign-in, callback (/api/auth/callback/google), session and sign-out endpoints. */
export const { GET, POST } = toNextJsHandler(auth);
