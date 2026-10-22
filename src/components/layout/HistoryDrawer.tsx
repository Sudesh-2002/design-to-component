"use client";

import { useEffect, useState } from "react";
import { FileCode2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";
import { useHistory } from "@/store/history";
import { usePlayground } from "@/store/playground";
import type { SavedGeneration } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function HistoryDrawer() {
  const open = useHistory((s) => s.open);
  return open ? <DrawerContent /> : null;
}

function DrawerContent() {
  const items = useHistory((s) => s.items);
  const loading = useHistory((s) => s.loading);
  const listError = useHistory((s) => s.listError);
  const setOpen = useHistory((s) => s.setOpen);
  const refresh = useHistory((s) => s.refresh);
  const remove = useHistory((s) => s.remove);

  const userId = useAuth((s) => s.user?.id);
  const activeId = usePlayground((s) => s.activeId);
  const loadSaved = usePlayground((s) => s.loadSaved);

  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) void refresh();
  }, [userId, refresh]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  function openItem(item: SavedGeneration) {
    const { code, savedCode } = usePlayground.getState();
    if (
      code.trim() &&
      code !== savedCode &&
      !window.confirm("Open this and discard your current unsaved code?")
    ) {
      return;
    }
    loadSaved(item);
    setOpen(false);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Saved generations"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 px-4">
          <h2 className="text-sm font-semibold">History</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close history"
            autoFocus
            className="rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-900 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {listError && (
            <p className="mb-3 rounded-lg border border-red-900 bg-red-950/50 p-3 text-xs text-red-300">
              {listError}
            </p>
          )}

          {loading && items.length === 0 && (
            <p className="text-sm text-neutral-500">Loading…</p>
          )}

          {!loading && !listError && items.length === 0 && (
            <p className="text-sm text-neutral-500">
              Nothing saved yet. Generate a component and press Save.
            </p>
          )}

          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 transition",
                  item.id === activeId
                    ? "border-violet-600/60 bg-violet-950/20"
                    : "border-neutral-800 hover:border-neutral-700"
                )}
              >
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded bg-neutral-900 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-600">
                      <FileCode2 className="h-5 w-5" />
                    </div>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-neutral-200">
                      {item.title}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {formatDate(item.updated_at)}
                    </span>
                  </span>
                </button>

                {confirmId === item.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmId(null);
                        void remove(item.id);
                      }}
                      className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-500"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-md px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="shrink-0 rounded-md p-1.5 text-neutral-600 transition hover:bg-neutral-900 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}