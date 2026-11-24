"use client";

import { GoogleMark, useGoogleSignIn } from "@/components/studio/GoogleSignIn";

/** Google sign-in on the connect screen; it comes back to the same Allow / Deny request. */
export default function SignInToContinue({ returnTo }: { returnTo: string }) {
  const { busy, signIn } = useGoogleSignIn(returnTo);
  return (
    <button
      type="button"
      onClick={signIn}
      disabled={busy}
      className="font-outfit inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-white px-5 text-[15px] font-medium text-[#1f1f1f] hover:bg-[#f8f9fa] active:translate-y-px disabled:opacity-60"
    >
      <GoogleMark size={18} />
      {busy ? "Opening Google…" : "Sign in with Google"}
    </button>
  );
}
