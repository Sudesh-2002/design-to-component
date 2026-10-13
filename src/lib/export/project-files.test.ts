import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { buildProjectFiles, toSlug } from "./project-files";
import { buildZip } from "./download";

const CODE =
  "export default function Component() {\n  return <p className={`a ${1}`}>Hi</p>;\n}";

describe("toSlug", () => {
  it("turns a prompt into an npm-safe name", () => {
    expect(toSlug("Pricing card with 3 tiers!")).toBe("pricing-card-with-3-tiers");
  });

  it("falls back for empty or non-latin input", () => {
    expect(toSlug("")).toBe("component-export");
    expect(toSlug("!!!")).toBe("component-export");
    expect(toSlug("日本語")).toBe("component-export");
  });

  it("truncates without leaving a trailing hyphen", () => {
    const slug = toSlug("word ".repeat(30));
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("buildProjectFiles", () => {
  const files = buildProjectFiles(CODE, "demo");

  it("includes every file a Vite project needs", () => {
    for (const path of [
      "package.json",
      "index.html",
      "vite.config.ts",
      "tailwind.config.js",
      "postcss.config.js",
      "src/main.tsx",
      "src/index.css",
      "src/Component.tsx",
    ]) {
      expect(files).toHaveProperty([path]);
    }
  });

  it("writes the component verbatim, ending with a newline", () => {
    expect(files["src/Component.tsx"]).toBe(CODE + "\n");
  });

  it("produces a valid package.json with pinned React", () => {
    const pkg = JSON.parse(files["package.json"]);
    expect(pkg.name).toBe("demo");
    expect(pkg.dependencies.react).toBe("18.3.1");
    expect(pkg.scripts.dev).toBe("vite");
  });
});

describe("buildZip", () => {
  it("puts every file under one root folder and round-trips content", () => {
    const files = buildProjectFiles(CODE, "demo");
    const unzipped = unzipSync(buildZip(files, "demo"));
    const paths = Object.keys(unzipped);

    expect(paths.every((p) => p.startsWith("demo/"))).toBe(true);
    expect(strFromU8(unzipped["demo/src/Component.tsx"])).toBe(CODE + "\n");
  });
});