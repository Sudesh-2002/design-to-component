import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { stashDraft } from "@/lib/draft";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { usePlayground } from "@/store/playground";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  init: () => () => void;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ loading: false });
      return () => {};
    }

    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false });
    });

    return () => data.subscription.unsubscribe();
  },

  signInWithGitHub: async () => {
    set({ error: null });

    const { prompt, code } = usePlayground.getState();
    if (code.trim()) stashDraft({ prompt, code });

    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (error) set({ error: error.message });
  },

  signOut: async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) set({ error: error.message });
  },
}));