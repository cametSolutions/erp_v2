import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { CalendarRange, FileText, ReceiptText } from "lucide-react";
import api from "@/api/client/apiClient";

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function StatementsPage() {
  const cmpId = useSelector((state) => state.company.selectedCompanyId);
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(formatDateInput(today));
  const [to, setTo] = useState(formatDateInput(today));

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["vouchers", cmpId, from, to],
    queryFn: async () => {
      const response = await api.get("/vouchers", {
        params: { cmpId, from, to, voucherType: "all" },
        skipGlobalLoader: true,
      });
      return response.data?.data || { vouchers: [], count: 0 };
    },
    enabled: Boolean(cmpId),
  });

  const vouchers = data?.vouchers || [];

  return (
    <div className="mx-auto w-full max-w-2xl min-h-screen bg-white">
      <div className="px-3 pb-6 pt-2 sm:px-4">
        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 flex-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-100 transition-all"
          />
          <span className="text-[11px] text-slate-400">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 flex-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-100 transition-all"
          />
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            {data?.count ?? 0} txns
          </span>
        </div>

        {/* Section title with list icon */}
        <h3 className="flex items-center gap-1.5 px-1 pt-3 pb-2 text-[12px] font-medium text-slate-600">
          <ReceiptText className="h-3.5 w-3.5 text-slate-500" />
          Today&apos;s Transactions
        </h3>

        {/* Vouchers */}
        {isLoading ? (
          <div className="px-1 py-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-18 rounded-md bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="px-1 py-4 text-[12px] text-rose-600">
            {error?.response?.data?.message || error?.message || "Failed to load vouchers."}
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="h-7 w-7 mb-2" />
            <p className="text-[12px]">No transactions found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 bg-white rounded-md">
            {vouchers.map((v) => {
              const amount = Number(v.credit || v.debit || 0).toFixed(2);
              return (
                <li
                  key={v._id}
                  className="bg-white active:bg-slate-100 sm:hover:bg-slate-50 transition-colors"
                >
                  {/* Main row */}
                  <div className="flex items-start justify-between px-4 pt-2 pb-1.5">
                    <div className="space-y-0.5">
                      {/* Voucher number */}
                      <p className="text-[9px] font-bold text-blue-500">
                        # {v.voucher_number}
                      </p>

                      {/* Party */}
                      <p className="text-[12px] font-bold truncate max-w-[150px]">
                        {v.party_name || "--"}
                      </p>

                      {/* Date + badge */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] text-slate-500">
                          {formatDate(v.date)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium">
                          {v.voucher_type}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <p className="mt-1 text-[11px] font-semibold text-slate-900">
                      <span className="text-[11px] font-medium text-slate-500 mr-0.5">
                        ₹
                      </span>
                      {amount}
                    </p>
                  </div>

                  {/* Footer strip (optional created_by) */}
                  {v.created_by && (
                    <div className="bg-slate-50 px-4 py-1">
                      <p className="text-[10px] text-slate-500">
                        Created by : {v.created_by}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
