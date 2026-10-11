import { create } from "zustand";
import { extractCode } from "@/lib/extract-code";
import { streamGeneration } from "@/lib/generate-client";
import { validateComponent } from "@/lib/validate-code";
import type { CodeIssue, GenerationStatus, ImageAttachment } from "@/types";

interface PlaygroundState {
  prompt: string;
  image: ImageAttachment | null;

  status: GenerationStatus;
  raw: string;
  code: string;
  issues: CodeIssue[];
  error: string | null;

  setPrompt: (prompt: string) => void;
  setImage: (image: ImageAttachment | null) => void;
  setCode: (code: string) => void;
  generate: () => Promise<void>;
  cancel: () => void;
}

let controller: AbortController | null = null;

export const usePlayground = create<PlaygroundState>((set, get) => ({
  prompt: "",
  image: null,
  status: "idle",
  raw: "",
  code: "",
  issues: [],
  error: null,

  setPrompt: (prompt) => set({ prompt }),
  setImage: (image) => set({ image }),
  setCode: (code) => set({ code, issues: validateComponent(code) }),

  generate: async () => {
    const { prompt, image } = get();

    controller?.abort();
    const current = new AbortController();
    controller = current;

    set({ status: "loading", raw: "", code: "", issues: [], error: null });

    try {
      await streamGeneration({
        prompt,
        image: image?.dataUrl,
        signal: current.signal,
        onChunk: (chunk) => {
          if (controller !== current) return; // superseded by a newer request
          const raw = get().raw + chunk;
          set({ status: "streaming", raw, code: extractCode(raw).code });
        },
      });

      if (controller !== current) return;

      const result = extractCode(get().raw);

      if (!result.code) {
        set({
          status: "error",
          error: "The model didn't return any code. Try rephrasing your description.",
        });
        return;
      }

      set({
        status: "done",
        code: result.code,
        issues: validateComponent(result.code, {
          truncated: result.fenced && !result.closed,
        }),
      });
    } catch (err) {
      if (controller !== current) return;

      if (err instanceof DOMException && err.name === "AbortError") {
        const { code } = get();
        set({
          status: "idle",
          issues: code ? validateComponent(code, { truncated: true }) : [],
        });
        return;
      }

      set({
        status: "error",
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      if (controller === current) controller = null;
    }
  },

  cancel: () => controller?.abort(),
}));