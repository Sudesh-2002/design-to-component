"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREVIEW_HTML } from "@/lib/preview-html";
import { isFromIframe } from "@/lib/preview-protocol";
import { usePlayground } from "@/store/playground";
import type { PreviewToIframe } from "@/types";

type Viewport = "mobile" | "tablet" | "full";

const VIEWPORTS: { id: Viewport; label: string; width: string; Icon: LucideIcon }[] = [
  { id: "mobile", label: "Mobile (375px)", width: "375px", Icon: Smartphone },
  { id: "tablet", label: "Tablet (768px)", width: "768px", Icon: Tablet },
  { id: "full", label: "Full width", width: "100%", Icon: Monitor },
];

const HANG_AFTER_MS = 5000;

type ViewState =
  | { phase: "idle" | "rendering" | "ok" }
  | { phase: "error"; message: string };

export function PreviewPanel() {
  const code = usePlayground((s) => s.code);
  const status = usePlayground((s) => s.status);
  const isGenerating = status === "loading" || status === "streaming";

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const idRef = useRef(0);
  const lastBeatRef = useRef(0);
  const lastSentRef = useRef("");
  const blockedCodeRef = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [viewport, setViewport] = useState<Viewport>("full");
  const [view, setView] = useState<ViewState>({ phase: "idle" });

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (!isFromIframe(e.data)) return;
      const msg = e.data;

      if (msg.type === "alive") {
        lastBeatRef.current = Date.now();
        return;
      }
      if (msg.type === "ready") {
        lastBeatRef.current = Date.now();
        setReady(true);
        return;
      }
      if (msg.type === "error" && msg.phase === "load") {
        setView({ phase: "error", message: msg.message });
        return;
      }
      if (msg.id !== idRef.current) return;

      if (msg.type === "rendered") {
        setView((prev) => (prev.phase === "error" ? prev : { phase: "ok" }));
      } else {
        setView({ phase: "error", message: msg.message });
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (blockedCodeRef.current !== null && blockedCodeRef.current !== code) {
      blockedCodeRef.current = null;
    }
    if (!ready || isGenerating || !code.trim()) return;
    if (blockedCodeRef.current === code) return;

    const timer = setTimeout(() => {
      const id = ++idRef.current;
      lastSentRef.current = code;
      setView({ phase: "rendering" });
      const message: PreviewToIframe = { type: "render", id, code };
      iframeRef.current?.contentWindow?.postMessage(message, "*");
    }, 350);

    return () => clearTimeout(timer);
  }, [code, ready, isGenerating]);

  useEffect(() => {
    if (!ready) return;
    lastBeatRef.current = Date.now();

    function onVisibility() {
      if (!document.hidden) lastBeatRef.current = Date.now();
    }
    document.addEventListener("visibilitychange", onVisibility);

    const timer = setInterval(() => {
      if (document.hidden) return;
      if (Date.now() - lastBeatRef.current < HANG_AFTER_MS) return;

      blockedCodeRef.current = lastSentRef.current;
      setReady(false);
      setNonce((n) => n + 1);
      setView({
        phase: "error",
        message:
          "The preview stopped responding and was restarted. The code may contain an infinite loop. Edit it to try again.",
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready]);

  function refresh() {
    blockedCodeRef.current = null;
    setReady(false);
    setView({ phase: "idle" });
    setNonce((n) => n + 1);
  }

  const width = VIEWPORTS.find((v) => v.id === viewport)!.width;
  const badge = isGenerating
    ? "Generating code…"
    : view.phase === "rendering"
      ? "Rendering…"
      : null;

  return (
    <div className="flex h-full min-h-[400px] flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {VIEWPORTS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={viewport === id}
              onClick={() => setViewport(id)}
              className={cn(
                "rounded-md p-1.5 transition",
                viewport === id
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <button
          type="button"
          title="Reload preview"
          aria-label="Reload preview"
          onClick={refresh}
          className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-neutral-300"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 justify-center overflow-auto rounded-lg border border-neutral-800 bg-neutral-950">
        <iframe
          key={nonce}
          ref={iframeRef}
          title="Component preview"
          srcDoc={PREVIEW_HTML}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          style={{ width }}
          className="max-w-full bg-white"
        />

        {!code.trim() && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 text-sm text-neutral-500">
            Your component will render here.
          </div>
        )}

        {badge && (
          <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-neutral-900/90 px-2.5 py-1 text-xs text-neutral-300 shadow">
            <Loader2 className="h-3 w-3 animate-spin" />
            {badge}
          </div>
        )}

        {view.phase === "error" && (
          <div className="absolute inset-x-2 bottom-2 rounded-lg border border-red-900 bg-red-950/95 p-3 shadow-lg">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-red-300">
              <XCircle className="h-3.5 w-3.5" />
              Preview error
            </div>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-red-200">
              {view.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}