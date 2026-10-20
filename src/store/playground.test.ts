import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/generate-client", () => ({ streamGeneration: vi.fn() }));

import { streamGeneration } from "@/lib/generate-client";
import { usePlayground } from "./playground";

const mockStream = vi.mocked(streamGeneration);

const ORIGINAL = "export default function Component() { return <p>one</p>; }";
const UPDATED = "export default function Component() { return <p>two</p>; }";
const fenced = (code: string) => "```tsx\n" + code + "\n```";

function resetStore() {
  usePlayground.setState({
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
  });
}

function streamReplies(text: string) {
  mockStream.mockImplementation(async ({ onChunk }) => {
    onChunk(text);
  });
}

describe("iterate mode", () => {
  beforeEach(() => {
    mockStream.mockReset();
    resetStore();
  });

  it("sends the editor code and the instruction, then swaps in the result", async () => {
    streamReplies(fenced(UPDATED));
    usePlayground.setState({ code: ORIGINAL, instruction: "say two" });

    await usePlayground.getState().iterate();

    const call = mockStream.mock.calls[0][0];
    expect(call.prompt).toBe("say two");
    expect(call.currentCode).toBe(ORIGINAL);

    const s = usePlayground.getState();
    expect(s.status).toBe("done");
    expect(s.code).toBe(UPDATED);
    expect(s.versions).toEqual([ORIGINAL]);
    expect(s.instruction).toBe("");
  });

  it("uses the user's manual edits as the base", async () => {
    streamReplies(fenced(UPDATED));
    const edited = ORIGINAL.replace("one", "edited by hand");
    usePlayground.setState({ code: edited, instruction: "x" });

    await usePlayground.getState().iterate();

    expect(mockStream.mock.calls[0][0].currentCode).toBe(edited);
  });

  it("does nothing without code or without an instruction", async () => {
    usePlayground.setState({ code: "", instruction: "do it" });
    await usePlayground.getState().iterate();

    usePlayground.setState({ code: ORIGINAL, instruction: "   " });
    await usePlayground.getState().iterate();

    expect(mockStream).not.toHaveBeenCalled();
  });

  it("restores the previous code when the request fails", async () => {
    mockStream.mockRejectedValue(new Error("provider down"));
    usePlayground.setState({ code: ORIGINAL, instruction: "x", versions: [] });

    await usePlayground.getState().iterate();

    const s = usePlayground.getState();
    expect(s.status).toBe("error");
    expect(s.error).toBe("provider down");
    expect(s.code).toBe(ORIGINAL);
    expect(s.versions).toEqual([]);
    expect(s.instruction).toBe("x");
  });

  it("restores the previous code when the model returns no code", async () => {
    streamReplies("Sorry, I can't do that.");
    usePlayground.setState({ code: ORIGINAL, instruction: "x" });

    await usePlayground.getState().iterate();

    const s = usePlayground.getState();
    expect(s.status).toBe("error");
    expect(s.code).toBe(ORIGINAL);
    expect(s.versions).toEqual([]);
  });

  it("restores the previous code when cancelled", async () => {
    mockStream.mockImplementation(async ({ onChunk }) => {
      onChunk("```tsx\nexport default function Comp");
      throw new DOMException("Aborted", "AbortError");
    });
    usePlayground.setState({ code: ORIGINAL, instruction: "x" });

    await usePlayground.getState().iterate();

    const s = usePlayground.getState();
    expect(s.status).toBe("idle");
    expect(s.code).toBe(ORIGINAL);
    expect(s.versions).toEqual([]);
  });

  it("keeps the saved row so 'Save changes' updates it", async () => {
    streamReplies(fenced(UPDATED));
    usePlayground.setState({
      code: ORIGINAL,
      instruction: "x",
      activeId: "row-1",
      savedCode: ORIGINAL,
    });

    await usePlayground.getState().iterate();

    const s = usePlayground.getState();
    expect(s.activeId).toBe("row-1");
    expect(s.savedCode).toBe(ORIGINAL);
    expect(s.code).not.toBe(s.savedCode);
  });

  it("caps the undo stack at 10 snapshots", async () => {
    streamReplies(fenced(UPDATED));
    const old = Array.from({ length: 10 }, (_, i) => `v${i}`);
    usePlayground.setState({ code: ORIGINAL, instruction: "x", versions: old });

    await usePlayground.getState().iterate();

    const { versions } = usePlayground.getState();
    expect(versions).toHaveLength(10);
    expect(versions[0]).toBe("v1");
    expect(versions[9]).toBe(ORIGINAL);
  });
});

describe("undo and new generations", () => {
  beforeEach(() => {
    mockStream.mockReset();
    resetStore();
  });

  it("undo steps back one version at a time", () => {
    usePlayground.setState({ code: "v3", versions: ["v1", "v2"] });

    usePlayground.getState().undoIteration();
    expect(usePlayground.getState().code).toBe("v2");

    usePlayground.getState().undoIteration();
    expect(usePlayground.getState().code).toBe("v1");
    expect(usePlayground.getState().versions).toEqual([]);

    usePlayground.getState().undoIteration();
    expect(usePlayground.getState().code).toBe("v1");
  });

  it("undo is ignored while generating", () => {
    usePlayground.setState({ code: "v2", versions: ["v1"], status: "streaming" });
    usePlayground.getState().undoIteration();
    expect(usePlayground.getState().code).toBe("v2");
  });

  it("a brand-new generation clears the undo stack and starts a new draft", async () => {
    streamReplies(fenced(UPDATED));
    usePlayground.setState({
      prompt: "a card",
      code: ORIGINAL,
      versions: ["old"],
      activeId: "row-1",
      savedCode: ORIGINAL,
    });

    await usePlayground.getState().generate();

    const s = usePlayground.getState();
    expect(mockStream.mock.calls[0][0].currentCode).toBeUndefined();
    expect(s.versions).toEqual([]);
    expect(s.activeId).toBeNull();
    expect(s.code).toBe(UPDATED);
  });
});