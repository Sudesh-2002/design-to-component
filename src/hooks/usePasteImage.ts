"use client";

import { useEffect, useRef } from "react";

export function usePasteImage(onImage: (file: File) => void, enabled = true) {
  const callbackRef = useRef(onImage);

  useEffect(() => {
    callbackRef.current = onImage;
  });

  useEffect(() => {
    if (!enabled) return;

    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            callbackRef.current(file);
            return;
          }
        }
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [enabled]);
}