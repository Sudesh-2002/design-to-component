import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Panel({ title, children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50",
        className
      )}
    >
      <div className="flex h-10 shrink-0 items-center border-b border-neutral-800 px-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          {title}
        </h2>
      </div>
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </section>
  );
}