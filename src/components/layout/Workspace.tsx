"use client";

import { Panel } from "@/components/panels/Panel";
import { InputPanel } from "@/components/panels/InputPanel";
import { CodePanel } from "@/components/panels/CodePanel";
import { PreviewPanel } from "@/components/panels/PreviewPanel";
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
    <main className="grid flex-1 grid-cols-1 gap-3 p-3 lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[340px_1fr_1fr] lg:grid-rows-1">
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
        <PreviewPanel />
      </Panel>

      <Panel title="Code">
        <CodePanel />
      </Panel>
    </main>
  );
}