"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, formatBytes } from "@/lib/image";
import type { ImageAttachment } from "@/types";

interface ImageDropzoneProps {
  image: ImageAttachment | null;
  processing: boolean;
  error: string | null;
  disabled?: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}

export function ImageDropzone({
  image,
  processing,
  error,
  disabled,
  onFile,
  onRemove,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  if (image) {
    return (
      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.dataUrl}
            alt="Design reference"
            className="max-h-56 w-full object-contain"
          />
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full bg-neutral-900/90 p-1.5 text-neutral-300 transition hover:bg-neutral-800 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-800 px-3 py-1.5 text-xs text-neutral-500">
          <span className="truncate pr-2">{image.name}</span>
          <span className="shrink-0">
            {image.width}×{image.height} · {formatBytes(image.sizeBytes)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition",
          dragging
            ? "border-violet-500 bg-violet-500/10"
            : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {processing ? (
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        ) : (
          <ImagePlus className="h-6 w-6 text-neutral-400" />
        )}
        <p className="text-sm text-neutral-300">
          {processing ? "Processing image…" : "Drop a screenshot, click to browse"}
        </p>
        <p className="text-xs text-neutral-500">
          or paste with Ctrl+V · PNG, JPEG, WebP
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}