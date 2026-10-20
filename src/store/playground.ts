import { create } from "zustand";
import { extractCode } from "@/lib/extract-code";
import { streamGeneration } from "@/lib/generate-client";
import { validateComponent } from "@/lib/validate-code";
import type {
  CodeIssue,
  GenerationStatus,
  ImageAttachment,
  SavedGeneration,
} from "@/types";

const MAX_VERSIONS = 10;

interface PlaygroundState {
  prompt: string;
  image: ImageAttachment | null;
  instruction: string;

  status: GenerationStatus;
  raw: string;
  code: string;
  generatedCode: string;
  versions: string[];
  issues: CodeIssue[];
  error: string | null;

  activeId: string | null;
  savedCode: string;

  setPrompt: (prompt: string) => void;
  setImage: (image: ImageAttachment | null) => void;
  setInstruction: (instruction: string) => void;
  setCode: (code: string) => void;
  generate: () => Promise<void>;
  iterate: () => Promise<void>;
  cancel: () => void;
  resetCode: () => void;
  undoIteration: () => void;
  loadSaved: (generation: SavedGeneration) => void;
}

let controller: AbortController | null = null;

export const usePlayground = create<PlaygroundState>((set, get) => {

  async function run(mode: "new" | "iterate") {
    const { prompt, image, instruction, code: baseCode, versions } = get();
    const iterating = mode === "iterate";

    if (iterating && (!baseCode.trim() || !instruction.trim())) return;

    controller?.abort();
    const current = new AbortController();
    controller = current;

    const start: Partial<PlaygroundState> = iterating
      ? {
          status: "loading",
          raw: "",
          code: "",
          issues: [],
          error: null,
          versions: [...versions, baseCode].slice(-MAX_VERSIONS),
        }
      : {
          status: "loading",
          raw: "",
          code: "",
          generatedCode: "",
          versions: [],
          issues: [],
          error: null,
          activeId: null,
          savedCode: "",
        };
    set(start);

    function finish(patch: Partial<PlaygroundState>) {
      if (iterating) {
        set({
          ...patch,
          code: baseCode,
          versions,
          issues: validateComponent(baseCode),
        });
      } else {
        set(patch);
      }
    }

    try {
      await streamGeneration({
        prompt: iterating ? instruction : prompt,
        image: image?.dataUrl,
        currentCode: iterating ? baseCode : undefined,
        signal: current.signal,
        onChunk: (chunk) => {
          if (controller !== current) return;
          const raw = get().raw + chunk;
          set({ status: "streaming", raw, code: extractCode(raw).code });
        },
      });

      if (controller !== current) return;

      const result = extractCode(get().raw);

      if (!result.code) {
        finish({
          status: "error",
          error: iterating
            ? "The model didn't return updated code. Try rephrasing your change."
            : "The model didn't return any code. Try rephrasing your description.",
        });
        return;
      }

      set({
        status: "done",
        code: result.code,
        generatedCode: result.code,
        ...(iterating ? { instruction: "" } : {}),
        issues: validateComponent(result.code, {
          truncated: result.fenced && !result.closed,
        }),
      });
    } catch (err) {
      if (controller !== current) return;

      if (err instanceof DOMException && err.name === "AbortError") {
        if (iterating) {
          finish({ status: "idle" });
        } else {
          const { code } = get();
          set({
            status: "idle",
            generatedCode: code,
            issues: code ? validateComponent(code, { truncated: true }) : [],
          });
        }
        return;
      }

      finish({
        status: "error",
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      if (controller === current) controller = null;
    }
  }

  return {
    prompt: "",
    image: null,
    instruction: "",
    status: "idle",
    raw: "",
    code: "",
    generatedCode: "",
    versions: [],
    issues: [],
    error: null,
    activeId: null,
    savedCode: "",

    setPrompt: (prompt) => set({ prompt }),
    setImage: (image) => set({ image }),
    setInstruction: (instruction) => set({ instruction }),

    setCode: (code) =>
      set((s) => ({
        code,
        issues: validateComponent(code),
        error: null,
        status: s.status === "error" ? "idle" : s.status,
      })),

    generate: () => run("new"),
    iterate: () => run("iterate"),

    cancel: () => controller?.abort(),

    resetCode: () => {
      const { generatedCode } = get();
      if (generatedCode) {
        set({ code: generatedCode, issues: validateComponent(generatedCode) });
      }
    },

    undoIteration: () => {
      const { versions, status } = get();
      if (versions.length === 0 || status === "loading" || status === "streaming") {
        return;
      }
      const previous = versions[versions.length - 1];
      set({
        code: previous,
        versions: versions.slice(0, -1),
        issues: validateComponent(previous),
        error: null,
        status: "idle",
      });
    },

    loadSaved: (g) => {
      controller?.abort();
      controller = null;

      set({
        prompt: g.prompt,
        image: null,
        instruction: "",
        status: "idle",
        raw: "",
        code: g.code,
        generatedCode: g.code,
        versions: [],
        issues: validateComponent(g.code),
        error: null,
        activeId: g.id,
        savedCode: g.code,
      });
    },
  };
});