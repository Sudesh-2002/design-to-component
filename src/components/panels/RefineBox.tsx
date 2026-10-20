"use client";

import { Sparkles, Undo2 } from "lucide-react";
import { usePlayground } from "@/store/playground";

const MAX_INSTRUCTION_LENGTH = 500;

const SUGGESTIONS = [
  "Make it dark mode",
  "Add hover and focus effects",
  "Make the layout more compact",
  "Improve the mobile layout",
];

export function RefineBox() {
  const code = usePlayground((s) => s.code);
  const instruction = usePlayground((s) => s.instruction);
  const status = usePlayground((s) => s.status);
  const hasImage = usePlayground((s) => s.image !== null);
  const versionCount = usePlayground((s) => s.versions.length);
  const setInstruction = usePlayground((s) => s.setInstruction);
  const iterate = usePlayground((s) => s.iterate);
  const undoIteration = usePlayground((s) => s.undoIteration);

  const isGenerating = status === "loading" || status === "streaming";

  if (!code.trim()) return null;

  const canApply = !isGenerating && instruction.trim().length > 0;

  return (
    <section
      aria-label="Refine the component"
      className="space-y-2 border-t border-neutral-800 pt-4"
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="instruction"
          className="text-xs font-medium text-neutral-400"
        >
          Refine this component
        </label>
        {versionCount > 0 && (
          <button
            type="button"
            onClick={undoIteration}
            disabled={isGenerating}
            title="Restore the code from before the last change"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo ({versionCount})
          </button>
        )}
      </div>

      <textarea
        id="instruction"
        rows={3}
        value={instruction}
        maxLength={MAX_INSTRUCTION_LENGTH}
        disabled={isGenerating}
        onChange={(e) => setInstruction(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (canApply) void iterate();
          }
        }}
        placeholder='e.g. "Make the buttons rounded and use an emerald accent"'
        className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-violet-500 disabled:opacity-50"
      />

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isGenerating}
            onClick={() => setInstruction(suggestion)}
            className="rounded-full border border-neutral-800 px-2.5 py-1 text-xs text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void iterate()}
        disabled={!canApply}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-600/60 bg-violet-600/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-600/20 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-transparent disabled:text-neutral-600"
      >
        <Sparkles className="h-4 w-4" />
        {isGenerating ? "Working…" : "Apply change"}
      </button>

      <p className="text-xs text-neutral-600">
        Edits whatever is in the code editor right now (including your own
        changes). Press Ctrl + Enter to apply.
        {hasImage &&
          " Your screenshot is sent with each change as a reference; remove it above to make changes faster."}
      </p>
    </section>
  );
}