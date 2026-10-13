"use client";

import { LogOut } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/store/auth";

export function AuthButton() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const error = useAuth((s) => s.error);
  const signIn = useAuth((s) => s.signInWithGitHub);
  const signOut = useAuth((s) => s.signOut);

  if (!isSupabaseConfigured) return null;

  if (loading) {
    return <div className="h-7 w-24 animate-pulse rounded-md bg-neutral-900" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        {error && (
          <span className="text-xs text-red-400" title={error}>
            Sign-in failed
          </span>
        )}
        <button
          type="button"
          onClick={signIn}
          className="flex items-center gap-1.5 rounded-md border border-neutral-800 px-2.5 py-1 text-xs text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
        >
          <GithubIcon className="h-3.5 w-3.5" />
          Sign in
        </button>
      </div>
    );
  }

  const meta = user.user_metadata as Record<string, unknown>;
  const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  const name =
    (typeof meta.user_name === "string" && meta.user_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email ||
    "Account";

  return (
    <div className="flex items-center gap-2">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          referrerPolicy="no-referrer"
          className="h-6 w-6 rounded-full border border-neutral-800"
        />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs uppercase">
          {name.charAt(0)}
        </div>
      )}
      <span className="hidden max-w-32 truncate text-xs text-neutral-400 sm:inline">
        {name}
      </span>
      <button
        type="button"
        onClick={signOut}
        title="Sign out"
        aria-label="Sign out"
        className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-neutral-200"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}