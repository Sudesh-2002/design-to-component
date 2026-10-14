import { describe, expect, it } from "vitest";
import { PREVIEW_HTML } from "./preview-html";

describe("PREVIEW_HTML", () => {
  const script = PREVIEW_HTML.match(/<script>([\s\S]*)<\/script>/)?.[1];

  it("contains an inline script", () => {
    expect(script).toBeTruthy();
  });

  it("inline script is syntactically valid", () => {
    expect(() => new Function(script!)).not.toThrow();
  });

  it("pins every CDN script to an exact version", () => {
    const srcs = [...PREVIEW_HTML.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) expect(src).toMatch(/\d+\.\d+\.\d+/);
  });

  it("includes the loop guard and heartbeat", () => {
    expect(script).toContain("__loopGuard");
    expect(script).toContain('type: "alive"');
  });
});