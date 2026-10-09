export type PanelId = "input" | "preview" | "code";

export interface GenerationState {
  status: "idle" | "loading" | "streaming" | "done" | "error";
  code: string;
  error?: string;
}

export interface ImageAttachment {
  dataUrl: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}