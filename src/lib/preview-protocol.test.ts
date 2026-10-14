import { describe, expect, it } from "vitest";
import { isFromIframe } from "./preview-protocol";

describe("isFromIframe", () => {
  it("accepts valid messages", () => {
    expect(isFromIframe({ type: "ready" })).toBe(true);
    expect(isFromIframe({ type: "alive" })).toBe(true);
    expect(isFromIframe({ type: "rendered", id: 3 })).toBe(true);
    expect(
      isFromIframe({ type: "error", id: 1, phase: "compile", message: "x" })
    ).toBe(true);
  });

  it("rejects malformed messages", () => {
    expect(isFromIframe(null)).toBe(false);
    expect(isFromIframe("ready")).toBe(false);
    expect(isFromIframe({ type: "rendered" })).toBe(false);
    expect(
      isFromIframe({ type: "error", id: 1, phase: "nope", message: "x" })
    ).toBe(false);
    expect(isFromIframe({ type: "unknown" })).toBe(false);
  });
});