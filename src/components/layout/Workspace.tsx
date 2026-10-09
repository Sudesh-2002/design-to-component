import { Panel } from "@/components/panels/Panel";

export function Workspace() {
  return (
    <main className="grid flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[340px_1fr_1fr]">
      <Panel title="Input">
        <p className="text-sm text-neutral-500">
          Image upload and prompt box will go here (Step 2).
        </p>
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