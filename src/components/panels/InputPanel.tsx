"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { ImageDropzone } from "@/components/panels/ImageDropzone";
import { usePasteImage } from "@/hooks/usePasteImage";
import { processImage, validateImageFile } from "@/lib/image";
import type { ImageAttachment } from "@/types";

const MAX_PROMPT_LENGTH = 1000;

interface InputPanelProps {
  prompt: string;
  image: ImageAttachment | null;
  isGenerating: boolean;
  onPromptChange: (value: string) => void;
  onImageChange: (image: ImageAttachment | null) => void;
  onGenerate: () => void;
}

export function InputPanel({
  prompt,
  image,
  isGenerating,
  onPromptChange,
  onImageChange,
  onGenerate,
}: InputPanelProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setProcessing(true);
    try {
      onImageChange(await processImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image.");
    } finally {
      setProcessing(false);
    }
  }

  usePasteImage(handleFile, !isGenerating);

  const canGenerate = !isGenerating && !processing && (prompt.trim() || image);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-400">
          Design reference
        </label>
        <ImageDropzone
          image={image}
          processing={processing}
          error={error}
          disabled={isGenerating}
          onFile={handleFile}
          onRemove={() => {
            setError(null);
            onImageChange(null);
          }}
        />
      </div>

      <div className="flex flex-1 flex-col">
        <label
          htmlFor="prompt"
          className="mb-1.5 block text-xs font-medium text-neutral-400"
        >
          Description
        </label>
        <textarea
          id="prompt"
          value={prompt}
          maxLength={MAX_PROMPT_LENGTH}
          disabled={isGenerating}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g. A pricing card with a monthly/yearly toggle, three tiers, and a highlighted 'Popular' plan"
          className="min-h-32 flex-1 resize-none rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-violet-500 disabled:opacity-50"
        />
        <p className="mt-1 text-right text-xs text-neutral-600">
          {prompt.length}/{MAX_PROMPT_LENGTH}
        </p>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        <Wand2 className="h-4 w-4" />
        {isGenerating ? "Generating…" : "Generate component"}
      </button>
    </div>
  );
}