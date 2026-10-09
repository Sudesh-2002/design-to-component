"use client";

import { useState } from "react";
import { Panel } from "@/components/panels/Panel";
import { InputPanel } from "@/components/panels/InputPanel";
import type { ImageAttachment } from "@/types";

export function Workspace() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<ImageAttachment | null>(null);
  const [isGenerating] = useState(false);

  function handleGenerate() {
    console.log("Generate:", {
      prompt,
      hasImage: !!image,
      imageSize: image?.sizeBytes,
    });
  }

  return (
    <main className="grid flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[340px_1fr_1fr]">
      <Panel title="Input">
        <InputPanel
          prompt={prompt}
          image={image}
          isGenerating={isGenerating}
          onPromptChange={setPrompt}
          onImageChange={setImage}
          onGenerate={handleGenerate}
        />
      </Panel>

      <Panel title="Preview">
        <p className="text-sm text-neutral-500">
          Live component preview will go here (Step 5).
        </p>
      </Panel>

      <Panel title="Code">
        <p className="text-sm text-neutral-500">
          Monaco editor will go here (Step 6).
        </p>
      </Panel>
    </main>
  );
}