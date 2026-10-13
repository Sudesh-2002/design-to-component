"use client";

import { Check, Loader2, Save } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/store/auth";
import { useHistory } from "@/store/history";
import { usePlayground } from "@/store/playground";

const toolbarButton =
  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-400";

export function SaveButton({ disabled }: { disabled: boolean }) {
  const user = useAuth((s) => s.user);
  const authLoading = useAuth((s) => s.loading);
  const signIn = useAuth((s) => s.signInWithGitHub);
  const saving = useHistory((s) => s.saving);
  const save = useHistory((s) => s.save);
  const code = usePlayground((s) => s.code);
  const activeId = usePlayground((s) => s.activeId);
  const savedCode = usePlayground((s) => s.savedCode);

  if (!isSupabaseConfigured || authLoading) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        disabled={disabled}
        title="Sign in with GitHub to save your work"
        className={toolbarButton}
      >
        <Save className="h-3.5 w-3.5" />
        Sign in to save
      </button>
    );
  }

  const isSaved = activeId !== null && code === savedCode;

  return (
    <button
      type="button"
      onClick={save}
      disabled={disabled || saving || isSaved}
      className={toolbarButton}
    >
      {saving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isSaved ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Save className="h-3.5 w-3.5" />
      )}
      {saving ? "Saving…" : isSaved ? "Saved" : activeId ? "Save changes" : "Save"}
    </button>
  );
}