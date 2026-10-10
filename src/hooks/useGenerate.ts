"use client";

import { useCallback, useRef, useState } from "react";
import { streamGeneration } from "@/lib/generate-client";
import type { GenerationState, ImageAttachment } from "@/types";

const INITIAL: GenerationState = { status: "idle", code: "" };

export function useGenerate() {
  const [state, setState] = useState<GenerationState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (prompt: string, image: ImageAttachment | null) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ status: "loading", code: "" });

      try {
        await streamGeneration({
          prompt,
          image: image?.dataUrl,
          signal: controller.signal,
          onChunk: (text) =>
            setState((prev) => ({
              status: "streaming",
              code: prev.code + text,
            })),
        });
        setState((prev) => ({ ...prev, status: "done" }));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled: keep whatever streamed so far
          setState((prev) => ({ ...prev, status: "idle" }));
          return;
        }
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "Something went wrong.",
        }));
      }
    },
    []
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return {
    ...state,
    isGenerating: state.status === "loading" || state.status === "streaming",
    generate,
    cancel,
  };
}