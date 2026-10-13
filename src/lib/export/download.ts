import { strToU8, zipSync } from "fflate";
import type { ProjectFiles } from "./project-files";

/** Zips the files under a single root folder, so unzipping doesn't spill files everywhere. */
export function buildZip(files: ProjectFiles, rootDir: string): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(files)) {
    entries[`${rootDir}/${path}`] = strToU8(content);
  }
  return zipSync(entries, { level: 6 });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), filename);
}

export function downloadZip(files: ProjectFiles, rootDir: string) {
  const bytes = buildZip(files, rootDir);
  downloadBlob(
    new Blob([new Uint8Array(bytes)], { type: "application/zip" }),
    `${rootDir}.zip`
  );
}