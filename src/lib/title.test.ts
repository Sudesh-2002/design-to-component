import { describe, expect, it } from "vitest";
import { makeTitle } from "./title";

describe("makeTitle", () => {
  it("falls back for empty prompts", () => {
    expect(makeTitle("")).toBe("Untitled component");
    expect(makeTitle("   \n ")).toBe("Untitled component");
  });

  it("collapses whitespace", () => {
    expect(makeTitle("A  pricing\n card")).toBe("A pricing card");
  });

  it("truncates long prompts with an ellipsis", () => {
    const title = makeTitle("word ".repeat(40));
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(true);
  });

  it("keeps short prompts untouched", () => {
    expect(makeTitle("Login form")).toBe("Login form");
  });
});