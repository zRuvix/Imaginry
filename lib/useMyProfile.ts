"use client";

import { useEffect, useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";
import type { Profile } from "@/lib/profile";

// One copy of the signed-in profile for the whole page, so the account bar,
// studio and profile pages don't each fetch it.
let current: { userId: string; profile: Profile } | null = null;
let loading: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setMyProfile(userId: string, profile: Profile) {
  current = { userId, profile };
  emit();
}

async function load(userId: string) {
  if (loading === userId) return;
  loading = userId;
  try {
    const res = await fetch("/api/profile");
    if (res.ok) setMyProfile(userId, (await res.json()).profile);
  } finally {
    loading = null;
  }
}

/** The session plus the signed-in user's profile (null while loading or signed out). */
export function useMyProfile() {
  const session = authClient.useSession();
  const userId = session.data?.user.id ?? null;
  const stored = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
  useEffect(() => {
    if (userId && stored?.userId !== userId) load(userId);
  }, [userId, stored?.userId]);

  return {
    session,
    user: session.data?.user ?? null,
    profile: userId && stored?.userId === userId ? stored.profile : null,
    setProfile: (p: Profile) => userId && setMyProfile(userId, p),
  };
}
