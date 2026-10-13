import { Sparkles } from "lucide-react";
import { AuthButton } from "@/components/layout/AuthButton";
import { HistoryButton } from "@/components/layout/HistoryButton";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 px-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-400" />
        <h1 className="text-sm font-semibold tracking-tight">
          Design → Component
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <HistoryButton />
        <AuthButton />
        <span className="hidden rounded-full border border-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400 sm:inline">
          beta
        </span>
      </div>
    </header>
  );
}