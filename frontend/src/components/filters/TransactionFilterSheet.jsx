import { useMemo, useState } from "react";
import { CalendarDays, Check, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  buildDateRangePresetOptions,
  findMatchingDatePreset,
  formatDateDisplay,
} from "@/utils/dateRangePresets";
import { DEFAULT_DAYBOOK_VOUCHER_TYPES } from "@/components/filters/daybookFilterOptions";

function summarizeVoucherTypes(selectedTypes, voucherTypeOptions) {
  if (!selectedTypes.length) return "All voucher types";
  if (selectedTypes.length === voucherTypeOptions.length) return "All voucher types";
  return selectedTypes
    .map(
      (selectedType) =>
        voucherTypeOptions.find((option) => option.value === selectedType)?.label ||
        selectedType,
    )
    .join(", ");
}

export default function TransactionFilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
  voucherTypeOptions = DEFAULT_DAYBOOK_VOUCHER_TYPES,
}) {
  const presets = useMemo(() => buildDateRangePresetOptions(new Date()), []);
  const [draft, setDraft] = useState(value);

  const selectedPreset = findMatchingDatePreset(draft.from, draft.to, presets);
  const hasAllVoucherTypes =
    draft.voucherTypes.length === 0 ||
    draft.voucherTypes.length === voucherTypeOptions.length;

  const handlePresetSelect = (preset) => {
    setDraft((current) => ({ ...current, from: preset.from, to: preset.to }));
  };

  const handleVoucherToggle = (voucherType) => {
    setDraft((current) => {
      const exists = current.voucherTypes.includes(voucherType);
      return {
        ...current,
        voucherTypes: exists
          ? current.voucherTypes.filter((item) => item !== voucherType)
          : [...current.voucherTypes, voucherType],
      };
    });
  };

  const handleSelectAllVoucherTypes = () => {
    setDraft((current) => ({
      ...current,
      voucherTypes: voucherTypeOptions.map((option) => option.value),
    }));
  };

  const handleReset = () => {
    const defaultPreset = presets.find((p) => p.id === "this-month") || presets[0];
    setDraft({
      from: defaultPreset.from,
      to: defaultPreset.to,
      voucherTypes: voucherTypeOptions.map((option) => option.value),
    });
  };

  const summaryText = `${formatDateDisplay(draft.from)} – ${formatDateDisplay(draft.to)} · ${summarizeVoucherTypes(draft.voucherTypes, voucherTypeOptions)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* ── Drag handle ── */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white px-5 pt-3 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <SheetHeader className="gap-0.5">
              <SheetTitle className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-slate-900">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                Filters
              </SheetTitle>
              <SheetDescription className="text-[11px] font-medium text-slate-400 tracking-wide">
                {summaryText}
              </SheetDescription>
            </SheetHeader>
            <SheetClose asChild>
           
            </SheetClose>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="space-y-6 px-5 py-5">

          {/* Date Range */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Date Range
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "From", key: "from" },
                { label: "To", key: "to" },
              ].map(({ label, key }) => (
                <label key={key} className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {label}
                  </span>
                  <input
                    type="date"
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((current) => ({ ...current, [key]: e.target.value }))
                    }
                    className="h-10 w-full rounded-sm border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-slate-100" />

          {/* Presets */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Quick Presets
            </h3>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-sm border border-slate-200 bg-white">
              {presets.map((preset) => {
                const isSelected = selectedPreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition ${
                      isSelected ? "bg-slate-50" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {/* Radio dot */}
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] transition ${
                          isSelected
                            ? "border-slate-900 bg-slate-900"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span
                        className={`text-[13px] font-medium ${
                          isSelected ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {preset.label}
                      </span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                      {formatDateDisplay(preset.from)} – {formatDateDisplay(preset.to)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-slate-100" />

          {/* Voucher Types */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Voucher Types
              </h3>
              <button
                type="button"
                onClick={handleSelectAllVoucherTypes}
                className="text-[11px] font-semibold text-slate-500 underline-offset-2 hover:underline transition"
              >
                Select all
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {voucherTypeOptions.map((option) => {
                const isSelected = draft.voucherTypes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleVoucherToggle(option.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-medium transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 opacity-80" />}
                    {option.label}
                  </button>
                );
              })}
            </div>

            {!hasAllVoucherTypes && (
              <p className="text-[11px] font-medium text-slate-400">
                {summarizeVoucherTypes(draft.voucherTypes, voucherTypeOptions)}
              </p>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4">
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1 h-11 rounded-xl border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={() => {
                onApply(draft);
                onOpenChange(false);
              }}
              className="flex-2 h-11 rounded-xl bg-slate-900 px-6 text-[13px] font-semibold text-white hover:bg-slate-800 transition"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}