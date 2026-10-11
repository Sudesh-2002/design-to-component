export interface ExtractResult {
  code: string;
  fenced: boolean;
  closed: boolean;
}

const OPEN_FENCE = /```[\w+-]*[ \t]*\r?\n/;
const LOOKS_LIKE_CODE =
  /^\s*(["']use client["'];?|import\s|export\s|function\s|const\s|\/\/|\/\*)/;

export function extractCode(raw: string): ExtractResult {
  const open = OPEN_FENCE.exec(raw);

  if (!open) {
    if (!raw.includes("```") && LOOKS_LIKE_CODE.test(raw)) {
      return { code: raw.trim(), fenced: false, closed: true };
    }
    return { code: "", fenced: false, closed: false };
  }

  const body = raw.slice(open.index + open[0].length);
  const end = body.indexOf("```");

  if (end !== -1) {
    return { code: body.slice(0, end).trim(), fenced: true, closed: true };
  }

  return {
    code: body.replace(/\n?`{1,2}$/, "").trimEnd(),
    fenced: true,
    closed: false,
  };
}