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