"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "@/components/icons";

/** Ends the admin session on this browser. */
export default function LockButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/admin", { method: "DELETE" }).catch(() => {});
        router.refresh();
      }}
      className="press flex h-9 items-center gap-1.5 rounded-full bg-[#e5484d] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#d63c41] disabled:opacity-50"
    >
      <Lock size={13} />
      Lock
    </button>
  );
}
