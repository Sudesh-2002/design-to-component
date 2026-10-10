"use client";

import { useState } from "react";
import { Panel } from "@/components/panels/Panel";
import { InputPanel } from "@/components/panels/InputPanel";
import { useGenerate } from "@/hooks/useGenerate";
import type { ImageAttachment } from "@/types";

export function Workspace() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<ImageAttachment | null>(null);
  const { code, status, error, isGenerating, generate, cancel } = useGenerate();

  return (
    <main className="grid flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[340px_1fr_1fr]">
      <Panel title="Input">
        <InputPanel
          prompt={prompt}
          image={image}
          isGenerating={isGenerating}
          onPromptChange={setPrompt}
          onImageChange={setImage}
          onGenerate={() => generate(prompt, image)}
          onCancel={cancel}
        />
      </Panel>

      <Panel title="Preview">
        <p className="text-sm text-neutral-500">
          Live component preview will go here (Step 5).
        </p>
      </Panel>

      <Panel title="Code">
        {status === "error" && (
          <p className="mb-3 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
        {status === "loading" && (
          <p className="text-sm text-neutral-500">Waiting for the model…</p>
        )}
        {code ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neutral-300">
            {code}
          </pre>
        ) : (
          status === "idle" && (
            <p className="text-sm text-neutral-500">
              Generated code will stream in here. The Monaco editor replaces
              this in Step 6.
            </p>
          )
        )}
      </Panel>
    </main>
  );
}