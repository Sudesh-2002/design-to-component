"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import { usePlayground } from "@/store/playground";

export function CodePanel() {
  const code = usePlayground((s) => s.code);
  const raw = usePlayground((s) => s.raw);
  const status = usePlayground((s) => s.status);
  const error = usePlayground((s) => s.error);
  const issues = usePlayground((s) => s.issues);

  return (
    <div className="space-y-3">
      {status === "error" && error && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {issues.length > 0 && status !== "streaming" && (
        <ul className="space-y-1.5">
          {issues.map((issue, i) => (
            <li
              key={i}
              className={
                issue.level === "error"
                  ? "flex items-start gap-2 rounded-lg border border-red-900/60 bg-red-950/40 p-2.5 text-xs text-red-300"
                  : "flex items-start gap-2 rounded-lg border border-amber-900/60 bg-amber-950/30 p-2.5 text-xs text-amber-300"
              }
            >
              {issue.level === "error" ? (
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}

      {status === "loading" && (
        <p className="text-sm text-neutral-500">Waiting for the model…</p>
      )}

      {code ? (
        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neutral-300">
          {code}
        </pre>
      ) : (
        status === "idle" && (
          <p className="text-sm text-neutral-500">
            Generated code will stream in here. The Monaco editor replaces this
            in Step 6.
          </p>
        )
      )}

      {raw && status !== "streaming" && (
        <details className="text-xs text-neutral-600">
          <summary className="cursor-pointer hover:text-neutral-400">
            Raw model output
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-words font-mono">
            {raw}
          </pre>
        </details>
      )}
    </div>
  );
}