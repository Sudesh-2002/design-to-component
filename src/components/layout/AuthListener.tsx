"use client";

import { useEffect } from "react";
import { takeDraft } from "@/lib/draft";
import { useAuth } from "@/store/auth";
import { useHistory } from "@/store/history";
import { usePlayground } from "@/store/playground";

export function AuthListener() {
  const init = useAuth((s) => s.init);
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const reset = useHistory((s) => s.reset);

  useEffect(() => init(), [init]);

  useEffect(() => {
    if (!loading && !user) reset();
  }, [loading, user, reset]);

  useEffect(() => {
    const draft = takeDraft();
    if (!draft) return;

    const state = usePlayground.getState();
    if (state.code.trim()) return;
    state.setPrompt(draft.prompt);
    state.setCode(draft.code);
  }, []);

  return null;
}