import { describe, expect, it } from "vitest";
import {
  ITERATE_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  buildIterateMessage,
  fenceFor,
} from "./prompts";

describe("fenceFor", () => {
  it("uses three backticks for ordinary code", () => {
    expect(fenceFor("const a = 1;")).toBe("```");
  });

  it("grows past backtick runs inside the code", () => {
    expect(fenceFor("a ``` b")).toBe("````");
    expect(fenceFor("a ```` b")).toBe("`````");
  });
});

describe("buildIterateMessage", () => {
  const code = "export default function C() { return null; }";

  it("includes the code and the change request", () => {
    const msg = buildIterateMessage(code, "make it blue");
    expect(msg).toContain(code);
    expect(msg).toContain("CHANGE REQUEST:\nmake it blue");
    expect(msg.startsWith("CURRENT CODE:\n```tsx\n")).toBe(true);
  });

  it("keeps the code fenced when it contains backticks", () => {
    const tricky = "const s = ```x```;\n" + code;
    const msg = buildIterateMessage(tricky, "change");
    expect(msg.startsWith("CURRENT CODE:\n````tsx\n")).toBe(true);
    expect(msg).toContain("\n````\n\nCHANGE REQUEST:");
  });
});

describe("system prompts", () => {
  it("share the same output rules", () => {
    for (const prompt of [SYSTEM_PROMPT, ITERATE_SYSTEM_PROMPT]) {
      expect(prompt).toContain("OUTPUT RULES (strict)");
      expect(prompt).toContain('The only allowed import is from "react"');
    }
  });

  it("iterate prompt asks for the complete file and minimal changes", () => {
    expect(ITERATE_SYSTEM_PROMPT).toContain("COMPLETE updated file");
    expect(ITERATE_SYSTEM_PROMPT).toContain("Apply ONLY the requested change");
  });
});