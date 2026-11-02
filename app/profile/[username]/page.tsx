import type { Metadata } from "next";
import { Suspense } from "react";
import ProfilePage from "@/components/profile/ProfilePage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Profile",
  description: "Designs this creator made in the Imaginry studio and shared. Open any of them and remix it.",
  path: "/explore",
  image: "/og/gallery.png",
  imageAlt: "Imaginry — designs shared by the community",
});

export default function Page() {
  // The username only exists at request time, so the profile streams in after the static shell.
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <ProfilePage />
    </Suspense>
  );
}
