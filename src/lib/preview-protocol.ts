import type { PreviewFromIframe } from "@/types";

export function isFromIframe(data: unknown): data is PreviewFromIframe {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  switch (d.type) {
    case "ready":
      return true;
    case "rendered":
      return typeof d.id === "number";
    case "error":
      return (
        typeof d.id === "number" &&
        typeof d.message === "string" &&
        (d.phase === "load" || d.phase === "compile" || d.phase === "runtime")
      );
    default:
      return false;
  }
}