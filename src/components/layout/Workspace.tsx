"use client";

import { Panel } from "@/components/panels/Panel";
import { InputPanel } from "@/components/panels/InputPanel";
import { CodePanel } from "@/components/panels/CodePanel";
import { usePlayground } from "@/store/playground";

export function Workspace() {
  const prompt = usePlayground((s) => s.prompt);
  const image = usePlayground((s) => s.image);
  const status = usePlayground((s) => s.status);
  const setPrompt = usePlayground((s) => s.setPrompt);
  const setImage = usePlayground((s) => s.setImage);
  const generate = usePlayground((s) => s.generate);
  const cancel = usePlayground((s) => s.cancel);

  const isGenerating = status === "loading" || status === "streaming";

  return (
    <main className="grid flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[340px_1fr_1fr]">
      <Panel title="Input">
        <InputPanel
          prompt={prompt}
          image={image}
          isGenerating={isGenerating}
          onPromptChange={setPrompt}
          onImageChange={setImage}
          onGenerate={generate}
          onCancel={cancel}
        />
      </Panel>

      <Panel title="Preview">
        <p className="text-sm text-neutral-500">
          Live component preview will go here (Step 5).
        </p>
      </Panel>

      <Panel title="Code">
        <CodePanel />
      </Panel>
    </main>
  );
}