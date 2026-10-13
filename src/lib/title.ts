export function makeTitle(prompt: string, max = 60): string {
  const clean = prompt.replace(/\s+/g, " ").trim();
  if (!clean) return "Untitled component";
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}