import type { CodeIssue } from "@/types";

const ALLOWED_IMPORTS = new Set(["react"]);
const IMPORT_RE = /^\s*import\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/gm;

const PAIRS: Array<[string, string]> = [
  ["{", "}"],
  ["(", ")"],
  ["[", "]"],
];

function count(text: string, char: string) {
  return text.split(char).length - 1;
}

export function validateComponent(
  code: string,
  opts: { truncated?: boolean } = {}
): CodeIssue[] {
  if (!code.trim()) {
    return [{ level: "error", message: "No code was generated." }];
  }

  const issues: CodeIssue[] = [];

  if (opts.truncated) {
    issues.push({
      level: "error",
      message:
        "Output looks incomplete (generation was stopped or hit the token limit).",
    });
  }

  if (!/export\s+default\s/.test(code)) {
    issues.push({
      level: "error",
      message:
        "Missing a default export. The preview needs `export default function Component()`.",
    });
  }

  const badImports = new Set<string>();
  for (const match of code.matchAll(IMPORT_RE)) {
    if (!ALLOWED_IMPORTS.has(match[1])) badImports.add(match[1]);
  }
  for (const spec of badImports) {
    issues.push({
      level: "error",
      message: `Imports "${spec}", which isn't available in the preview. Only "react" is allowed.`,
    });
  }

  if (!opts.truncated) {
    for (const [open, close] of PAIRS) {
      if (count(code, open) !== count(code, close)) {
        issues.push({
          level: "warning",
          message: `Unbalanced "${open}" and "${close}". The code may be malformed.`,
        });
        break;
      }
    }
  }

  if (/src=["']https?:\/\//.test(code)) {
    issues.push({
      level: "warning",
      message:
        "Uses external image URLs, which may not load in the sandboxed preview.",
    });
  }

  return issues;
}