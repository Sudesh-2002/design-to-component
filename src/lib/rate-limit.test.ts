import { beforeEach, describe, expect, it } from "vitest";
import { clearMemoryLimits, formatWait, memoryLimit } from "./rate-limit";

const WINDOW = 60_000;

describe("memoryLimit", () => {
  beforeEach(() => clearMemoryLimits());

  it("allows up to the limit, then blocks", () => {
    const t = 1_000_000;
    expect(memoryLimit("a", 2, WINDOW, t).allowed).toBe(true);
    expect(memoryLimit("a", 2, WINDOW, t + 1).allowed).toBe(true);

    const blocked = memoryLimit("a", 2, WINDOW, t + 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports how long until the oldest hit expires", () => {
    const t = 1_000_000;
    memoryLimit("a", 1, WINDOW, t);
    const blocked = memoryLimit("a", 1, WINDOW, t + 10_000);
    expect(blocked.retryAfterSec).toBe(50);
  });

  it("slides: allows again once old hits leave the window", () => {
    const t = 1_000_000;
    memoryLimit("a", 1, WINDOW, t);
    expect(memoryLimit("a", 1, WINDOW, t + 1000).allowed).toBe(false);
    expect(memoryLimit("a", 1, WINDOW, t + WINDOW + 1).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const t = 1_000_000;
    memoryLimit("a", 1, WINDOW, t);
    expect(memoryLimit("b", 1, WINDOW, t).allowed).toBe(true);
  });

  it("counts remaining requests", () => {
    expect(memoryLimit("a", 3, WINDOW, 1000).remaining).toBe(2);
    expect(memoryLimit("a", 3, WINDOW, 1001).remaining).toBe(1);
  });
});

describe("formatWait", () => {
  it("formats seconds and minutes", () => {
    expect(formatWait(1)).toBe("1 second");
    expect(formatWait(45)).toBe("45 seconds");
    expect(formatWait(60)).toBe("1 minute");
    expect(formatWait(61)).toBe("2 minutes");
  });
});