export type PanelId = "input" | "preview" | "code";

export type GenerationStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "done"
  | "error";

export interface CodeIssue {
  level: "error" | "warning";
  message: string;
}

export interface GenerateRequest {
  prompt: string;
  image?: string;
}

export interface ImageAttachment {
  dataUrl: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export type PreviewToIframe = { type: "render"; id: number; code: string };

export type PreviewFromIframe =
  | { type: "ready" }
  | { type: "alive" }
  | { type: "rendered"; id: number }
  | {
      type: "error";
      id: number;
      phase: "load" | "compile" | "runtime";
      message: string;
    };

export interface SavedGeneration {
  id: string;
  title: string;
  prompt: string;
  code: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}