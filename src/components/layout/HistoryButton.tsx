"use client";

import { History } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/store/auth";
import { useHistory } from "@/store/history";

export function HistoryButton() {
  const user = useAuth((s) => s.user);
  const setOpen = useHistory((s) => s.setOpen);

  if (!isSupabaseConfigured || !user) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 rounded-md border border-neutral-800 px-2.5 py-1 text-xs text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
    >
      <History className="h-3.5 w-3.5" />
      History
    </button>
  );
}