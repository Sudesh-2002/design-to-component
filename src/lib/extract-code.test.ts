import { describe, expect, it } from "vitest";
import { extractCode } from "./extract-code";
import { validateComponent } from "./validate-code";

const COMPONENT = `export default function Component() {
  return <div>Hi</div>;
}`;

describe("extractCode", () => {
  it("extracts code from a closed fence", () => {
    const r = extractCode("```tsx\n" + COMPONENT + "\n```");
    expect(r).toEqual({ code: COMPONENT, fenced: true, closed: true });
  });

  it("ignores prose and later blocks", () => {
    const raw =
      "Here you go:\n```tsx\n" + COMPONENT + "\n```\nAnd also:\n```css\na{}\n```";
    expect(extractCode(raw).code).toBe(COMPONENT);
  });

  it("handles an open fence mid-stream and hides partial closing backticks", () => {
    const open = extractCode("```tsx\nexport default function C() {\n``");
    expect(open.closed).toBe(false);
    expect(open.code).toBe("export default function C() {");
  });

  it("returns nothing while the opening fence is still arriving", () => {
    expect(extractCode("``").code).toBe("");
    expect(extractCode("```ts").code).toBe("");
  });

  it("accepts bare code without a fence", () => {
    const r = extractCode(COMPONENT);
    expect(r.code).toBe(COMPONENT);
    expect(r.fenced).toBe(false);
  });

  it("returns nothing for prose-only output", () => {
    expect(extractCode("Sorry, I can't help with that.").code).toBe("");
  });
});

describe("validateComponent", () => {
  it("passes a clean component", () => {
    expect(validateComponent(COMPONENT)).toEqual([]);
  });

  it("flags disallowed imports", () => {
    const issues = validateComponent(
      `import { Check } from "lucide-react";\n${COMPONENT}`
    );
    expect(issues.some((i) => i.message.includes("lucide-react"))).toBe(true);
  });

  it("allows react imports", () => {
    const code = `import { useState } from "react";\n${COMPONENT}`;
    expect(validateComponent(code)).toEqual([]);
  });

  it("flags a missing default export", () => {
    const issues = validateComponent("function C() { return null; }");
    expect(issues[0].message).toMatch(/default export/);
  });

  it("flags truncated output", () => {
    const issues = validateComponent("export default function C() {", {
      truncated: true,
    });
    expect(issues.some((i) => /incomplete/.test(i.message))).toBe(true);
  });
});