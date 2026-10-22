"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileCode2,
  type LucideIcon,
} from "lucide-react";
import { downloadText, downloadZip } from "@/lib/export/download";
import { buildProjectFiles, toSlug } from "@/lib/export/project-files";
import { openInStackBlitz } from "@/lib/export/stackblitz";
import { usePlayground } from "@/store/playground";

interface ExportMenuProps {
  code: string;
  disabled: boolean;
  hasErrors: boolean;
}

const toolbarButton =
  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-400";

function MenuItem({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:outline-none"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
      <span>
        <span className="block text-xs font-medium text-neutral-200">
          {label}
        </span>
        <span className="block text-xs text-neutral-500">{hint}</span>
      </span>
    </button>
  );
}

export function ExportMenu({ code, disabled, hasErrors }: ExportMenuProps) {
  const prompt = usePlayground((s) => s.prompt);

  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const isOpen = open && !disabled;

  useEffect(() => {
    if (!isOpen) return;

    function onMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function run(action: () => void) {
    setError(null);
    try {
      action();
      setOpen(false);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    }
  }

  const name = toSlug(prompt);

  return (
    <div ref={rootRef} className="relative z-20">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setOpen((o) => !o)}
        className={toolbarButton}
      >
        {done ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {done ? "Done" : "Export"}
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-neutral-800 bg-neutral-900 p-1 shadow-xl"
        >
          {hasErrors && (
            <p className="m-1 rounded-md border border-amber-900/60 bg-amber-950/30 p-2 text-xs text-amber-300">
              This code has errors, so the exported project may not run.
            </p>
          )}

          <MenuItem
            icon={FileCode2}
            label="Download component"
            hint="component.tsx, exactly as in the editor"
            onClick={() =>
              run(() => downloadText(code.trimEnd() + "\n", "component.tsx"))
            }
          />
          <MenuItem
            icon={Archive}
            label="Download project"
            hint="Vite + React + Tailwind, as a .zip"
            onClick={() =>
              run(() => downloadZip(buildProjectFiles(code, name), name))
            }
          />
          <MenuItem
            icon={ExternalLink}
            label="Open in StackBlitz"
            hint="Sends this code to stackblitz.com"
            onClick={() =>
              run(() =>
                openInStackBlitz(buildProjectFiles(code, name), { title: name })
              )
            }
          />

          {error && (
            <p className="m-1 rounded-md border border-red-900 bg-red-950/50 p-2 text-xs text-red-300">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}