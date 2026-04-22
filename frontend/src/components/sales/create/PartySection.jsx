import { useState } from "react";
import { ChevronRight, User2 } from "lucide-react";
import { useSelector } from "react-redux";

import PartySelectSheet from "@/components/PartySelectSheet";
import { formatCurrency } from "@/components/sales/create/helpers";
import SectionCard from "@/components/sales/create/SectionCard";

// Party selection block.
// Party is a mandatory dependency for sale order because:
// - it drives tax type (IGST vs CGST/SGST)
// - it is required before item selection/rate resolution
export default function PartySection({ locked = false }) {
  const [open, setOpen] = useState(false);
  const party = useSelector((state) => state.transaction.party);
  const partyDetails = [
    party?.gstNo ? `GST ${party.gstNo}` : null,
    party?.billingAddress || null,
    party?.shippingAddress || null,
    party?.state ? `State ${party.state}` : null,
  ].filter(Boolean);

  return (
    <>
      <SectionCard
        title="Party"
        required
        subtitle="Select the customer for this order"
        icon={User2}
        tone="blue"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {locked ? (
            <div className="inline-flex flex-1 items-center justify-between rounded-xl border border-sky-200 bg-sky-50/40 px-3 py-3 text-left text-xs font-medium text-slate-700">
              <span className="inline-flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <User2 className="h-3.5 w-3.5" />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-900">
                    {party?.partyName ? party.partyName : "Party"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {party?.mobileNumber || party?.emailID || "Locked for edit"}
                  </span>
                </span>
              </span>
              <span className="text-[11px] font-semibold text-sky-700">
                Locked
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex flex-1 items-center justify-between rounded-xl border border-sky-200 bg-sky-50/40 px-3 py-3 text-left text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              <span className="inline-flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <User2 className="h-3.5 w-3.5" />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-900">
                    {party?.partyName ? party.partyName : "Add Party Name"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {party?.mobileNumber ||
                      party?.emailID ||
                      "Search and select customer"}
                  </span>
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="hidden text-[11px] text-sky-700 sm:inline">
                  {party?.totalOutstanding != null
                    ? `Outstanding ${formatCurrency(party.totalOutstanding)}`
                    : "Search / Select"}
                </span>
                <ChevronRight className="h-4 w-4 text-sky-500" />
              </span>
            </button>
          )}
        </div>
        {partyDetails.length > 0 && (
          <div className="mt-3 rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-[11px] text-slate-600">
            {partyDetails.map((detail) => (
              <p key={detail} className="leading-5">
                {detail}
              </p>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Selection sheet is disabled in edit mode where party is locked. */}
      {!locked && <PartySelectSheet open={open} onOpenChange={setOpen} />}
    </>
  );
}
