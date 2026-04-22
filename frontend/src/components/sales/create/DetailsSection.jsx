import { useState } from "react";
import { ChevronRight, Truck } from "lucide-react";
import { useSelector } from "react-redux";

import DespatchDetailsSheet from "@/components/DespatchDetailsSheet";
import SectionCard from "@/components/sales/create/SectionCard";

// Despatch/order metadata block.
// This section captures logistics fields that are stored with the voucher
// and used in detail/print views.
export default function DetailsSection() {
  const [open, setOpen] = useState(false);
  const despatch = useSelector((state) => state.transaction.despatchDetails);
  const despatchPreview = [
    despatch?.challanNo ? `Challan: ${despatch.challanNo}` : null,
    despatch?.despatchThrough ? `Via ${despatch.despatchThrough}` : null,
    despatch?.vehicleNo ? `Vehicle: ${despatch.vehicleNo}` : null,
    despatch?.destination ? `Dest: ${despatch.destination}` : null,
  ]
    .filter(Boolean)
    .slice(0, 2);

  const hasDetails = Boolean(
    despatch?.challanNo ||
      despatch?.destination ||
      despatch?.vehicleNo ||
      despatch?.despatchThrough,
  );

  return (
    <>
      <SectionCard
        title="Order details"
        required
        subtitle="Control dates, reference and series"
        icon={Truck}
        tone="amber"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Despatch details
            </label>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-3 text-[11px] font-medium text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
            >
              <span className="text-left">
                {hasDetails
                  ? "Edit Despatch Details"
                  : "+ Add Despatch Details"}
              </span>
              <ChevronRight className="h-4 w-4 text-amber-500" />
            </button>
            {despatchPreview.length > 0 && (
              <p
                className="mt-2 truncate rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-[11px] leading-5 text-slate-600"
                title={despatchPreview.join(" · ")}
              >
                {despatchPreview.join(" · ")}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <DespatchDetailsSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
