// src/pages/outstanding/OutstandingPartyDetailPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePartyOutstandingQuery } from "@/hooks/queries/outstandingQueries";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { LedgerFilter } from "./LedgerFilter";

export default function OutstandingPartyDetailPage() {
  const { partyId } = useParams();
  const cmpId =
    useSelector((state) => state.company.selectedCompanyId) || "";
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = usePartyOutstandingQuery(
    partyId,
    cmpId,
  );

  const [ledgerType, setLedgerType] = useState("ledger");

  useEffect(() => {
    if (!isError) return;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load outstanding";
    toast.error(message);
  }, [isError, error]);

  const bills = data?.items || [];

  const { filteredBills, total, partyName } = useMemo(() => {
    if (!bills.length)
      return { filteredBills: [], total: 0, partyName: "" };

    const list = bills.filter((b) => {
      const val = Number(b.bill_pending_amt || 0);
      if (ledgerType === "receivable") return val > 0;
      if (ledgerType === "payable") return val < 0;
      return true; // ledger
    });

    const sum = list.reduce(
      (acc, b) => acc + Number(b.bill_pending_amt || 0),
      0,
    );

    const name =
      bills[0]?.party_name ||
      bills[0]?.partyName ||
      bills[0]?.alias ||
      "";

    return { filteredBills: list, total: sum, partyName: name };
  }, [bills, ledgerType]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 font-[sans-serif]">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-slate-200 p-4">
        {/* Top header card */}
        <div className="mb-4 rounded-2xl bg-[#3b82f6] px-4 py-4 text-white">
          {/* top row: back button, party name, dropdown at right */}
          <div className="mb-3 flex  gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full "
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

          

            {/* dropdown fixed to top-right */}
            <LedgerFilter
              value={ledgerType}
              onChange={(v) => setLedgerType(v)}
            />
          </div>

          <div className="mt-2 text-right">
            <p className="text-sm font-semibold">
                {partyName || "Party"}
              </p>
            <p className="mt-1 text-2xl font-bold">
              {total.toFixed(2)}{" "}
              <span className="text-sm font-semibold">Dr</span>
            </p>
          </div>
        </div>

        {/* Transactions list */}
        <div className="rounded-2xl bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">
              Transactions
            </p>
          </div>

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          )}

          {!isLoading && filteredBills.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
              No outstanding bills for this party.
            </div>
          )}

          {!isLoading && filteredBills.length > 0 && (
            <div className="space-y-2">
              {filteredBills.map((bill) => (
                <div
                  key={bill._id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {bill.bill_no}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(bill.bill_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {Number(bill.bill_pending_amt || 0).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {bill.classification || "Dr"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
