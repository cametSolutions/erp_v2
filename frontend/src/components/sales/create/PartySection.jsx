import { useState } from "react";
import { ChevronRight, User2 } from "lucide-react";
import { useSelector } from "react-redux";

import PartySelectSheet from "@/components/PartySelectSheet";
import { formatCurrency } from "@/components/sales/create/helpers";
import SectionCard from "@/components/sales/create/SectionCard";

export default function PartySection() {
  const [open, setOpen] = useState(false);
  const party = useSelector((state) => state.transaction.party);

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
        </div>
      </SectionCard>

      <PartySelectSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
