import { CalendarRange, SlidersHorizontal } from "lucide-react";

export default function TransactionFilterSummaryCard({
  title,
  fromLabel,
  toLabel,
  subtitle,
  metaLabel = "Transactions",
  count = 0,
  onOpenFilters,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#3e5c76] shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
            {title}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <CalendarRange className="h-4 w-4 " />
            {fromLabel}
            <span className="text-white">-</span>
            {toLabel}
          </p>
          <p className="mt-1 truncate text-xs text-slate-300">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onOpenFilters}
          className="mr-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          Filters
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3 py-2.5">
        <p className="text-[12px] font-semibold text-slate-700">{metaLabel}</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
          {count} entries
        </span>
      </div>
    </div>
  );
}
