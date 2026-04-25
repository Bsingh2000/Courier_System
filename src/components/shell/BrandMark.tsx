import { Package2 } from "lucide-react";

export function BrandMark() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-emerald-400 text-slate-950 shadow-lg shadow-orange-500/20">
        <Package2 className="h-5 w-5" />
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-orange-200/90">
          RouteGrid
        </p>
        <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
          Courier Operations
        </p>
      </div>
    </div>
  );
}
