import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import AdminUnlock from "@/components/admin/AdminUnlock";
import Dashboard from "@/components/admin/Dashboard";
import { adminEnabled, isAdmin } from "@/lib/server/admin";
import { loadMetrics } from "@/lib/server/metrics";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function Gate() {
  // Request-time only: never prerendered, so the clock and cookie are live.
  await connection();
  const admin = await isAdmin();
  if (!adminEnabled()) notFound();
  if (!admin) return <AdminUnlock />;
  return <Dashboard metrics={await loadMetrics()} at={new Date().toISOString()} />;
}

export default function Page() {
  return (
    <main className="min-h-screen bg-ink text-bone">
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    </main>
  );
}
