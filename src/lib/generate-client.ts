import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { GenerateRequest } from "@/types";

type ErrorKind = "offline" | "network" | "rate_limit" | "server" | "request";

export class GenerateError extends Error {
  kind: ErrorKind;
  retryAfter?: number;

  constructor(message: string, kind: ErrorKind, retryAfter?: number) {
    super(message);
    this.name = "GenerateError";
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

interface StreamOptions extends GenerateRequest {
  signal?: AbortSignal;
  onChunk: (text: string) => void;
}

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function streamGeneration({
  prompt,
  image,
  signal,
  onChunk,
}: StreamOptions): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new GenerateError(
      "You appear to be offline. Check your connection and try again.",
      "offline"
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, image }),
      signal,
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    throw new GenerateError(
      "Couldn't reach the server. Check your connection and try again.",
      "network"
    );
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message =
      typeof data?.error === "string" ? data.error : `Request failed (${res.status}).`;
    const kind: ErrorKind =
      res.status === 429 ? "rate_limit" : res.status >= 500 ? "server" : "request";
    throw new GenerateError(
      message,
      kind,
      typeof data?.retryAfter === "number" ? data.retryAfter : undefined
    );
  }
  if (!res.body) {
    throw new GenerateError("The server returned an empty response.", "server");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
  } catch (err) {
    if (isAbort(err)) throw err;
    throw new GenerateError(
      "The connection was interrupted, so the code may be incomplete.",
      "network"
    );
  }
}