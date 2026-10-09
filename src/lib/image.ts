import type { ImageAttachment } from "@/types";

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_FILE_SIZE_MB = 8;
const MAX_DIMENSION = 1568;
const JPEG_QUALITY = 0.9;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Only PNG, JPEG or WebP images are supported.";
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Image must be smaller than ${MAX_FILE_SIZE_MB} MB.`;
  }
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = src;
  });
}

export async function processImage(file: File): Promise<ImageAttachment> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight)
    );
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const base64Length = dataUrl.length - dataUrl.indexOf(",") - 1;

    return {
      dataUrl,
      name: file.name || "pasted-image.jpg",
      mimeType: "image/jpeg",
      width,
      height,
      sizeBytes: Math.round((base64Length * 3) / 4),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}