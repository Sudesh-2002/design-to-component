import type { GenerateRequest } from "@/types";

interface StreamOptions extends GenerateRequest {
  signal?: AbortSignal;
  onChunk: (text: string) => void;
}

export async function streamGeneration({
  prompt,
  image,
  signal,
  onChunk,
}: StreamOptions): Promise<void> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image }),
    signal,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  if (!res.body) {
    throw new Error("The server returned an empty response.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}