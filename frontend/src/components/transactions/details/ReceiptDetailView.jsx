import { ArrowRight, BadgeIndianRupee, Building2, CreditCard, ReceiptText, User2 } from "lucide-react";

import CancelVoucherDialog from "@/components/transactions/details/CancelVoucherDialog";

/**
 * Formats backend date value into UI-friendly `DD Mon YYYY`.
 *
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats numeric values into rupee display string.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function formatAmount(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

/**
 * Compact summary tile used in receipt header grid.
 *
 * @param {{label: string, value: string, tone?: "slate"|"blue"|"teal"}} props
 * @returns {JSX.Element}
 */
function SummaryTile({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-900",
    blue: "border-sky-200 bg-sky-50 text-sky-950",
    teal: "border-teal-200 bg-teal-50 text-teal-950",
  };

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tones[tone] || tones.slate}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-semibold">{value}</p>
    </div>
  );
}

/**
 * Generic section wrapper for detail blocks.
 *
 * @param {{title: string, icon?: React.ComponentType, children: React.ReactNode}} props
 * @returns {JSX.Element}
 */
function SectionCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        </span>
        <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
      </header>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  );
}

/**
 * Receipt detail renderer.
 *
 * @param {{
 *   receipt: object,
 *   onCancel?: () => void,
 *   isCancelling?: boolean
 * }} props
 * @returns {JSX.Element}
 */
export default function ReceiptDetailView({ receipt, onCancel, isCancelling = false }) {
  const isCancelled = receipt?.status === "cancelled";
  const statusTone =
    receipt?.status === "cancelled"
      ? "bg-rose-100 text-rose-800"
      : "bg-emerald-100 text-emerald-800";
  const settlementDetails = receipt?.settlement_details || [];

  return (
    <div className="mx-auto flex w-full flex-col gap-3 px-1 py-4">
      <section className="overflow-hidden rounded-xl border-4 border-white bg-[#757bc8] px-4 py-4 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200/80">
              Receipt
            </p>
            <h1 className="text-xl font-semibold tracking-[0.01em]">
              {receipt?.voucher_number || "--"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-100/90">
              <span>{formatDate(receipt?.date)}</span>
              <span className="text-slate-300">•</span>
              <span>{receipt?.party_name || "No party selected"}</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusTone}`}>
              {receipt?.status || "active"}
            </span>
            <div className="text-left md:text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-200/75">
                Receipt Amount
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatAmount(receipt?.amount)}
              </p>
            </div>
            <CancelVoucherDialog
              label="Cancel"
              title="Cancel receipt?"
              description="This will mark the receipt as cancelled. This action can be reverted later if needed."
              warning="Settlements are reverted only if the outstanding exists."
              isCancelled={isCancelled}
              isLoading={isCancelling}
              onConfirm={onCancel}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile label="Party" value={receipt?.party_name || "--"} tone="blue" />
        <SummaryTile label="Date" value={formatDate(receipt?.date)} />
        <SummaryTile label="Advance" value={formatAmount(receipt?.advance_amount)} tone="teal" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-3">
          <SectionCard title="Settlement Details" icon={ReceiptText}>
            {settlementDetails.length === 0 ? (
              <p className="text-sm text-slate-500">No bills were settled.</p>
            ) : (
              <div className="space-y-2.5">
                {settlementDetails.map((item) => (
                  <div
                    key={item._id || item.outstanding}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-900">
                          {item.outstanding_number || "Bill"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatDate(item.outstanding_date)} • Type {item.outstanding_type || "--"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Previous {formatAmount(item.previous_outstanding_amount)} • Remaining {formatAmount(item.remaining_outstanding_amount)}
                        </p>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-900">
                        {formatAmount(item.settled_amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Narration" icon={ArrowRight}>
            <p className="text-[12px] text-slate-600">
              {receipt?.narration || "No narration available."}
            </p>
          </SectionCard>
        </div>

        <div className="space-y-3">
          <SectionCard title="Party Details" icon={User2}>
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-slate-900">
                {receipt?.party_name || "--"}
              </p>
              <p className="text-[12px] text-slate-500">
                Voucher Type {receipt?.voucher_type || "receipt"}
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Cash / Bank" icon={Building2}>
            <div className="space-y-2 text-[12px] text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Account</span>
                <span className="text-right text-slate-900">{receipt?.cash_bank_name || "--"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Type</span>
                <span className="text-right text-slate-900">{receipt?.cash_bank_type || "--"}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Instrument" icon={CreditCard}>
            <div className="space-y-2 text-[12px] text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Mode</span>
                <span className="text-right text-slate-900">{receipt?.instrument_type || "--"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Cheque Number</span>
                <span className="text-right text-slate-900">{receipt?.cheque_number || "--"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Cheque Date</span>
                <span className="text-right text-slate-900">{formatDate(receipt?.cheque_date)}</span>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between gap-4 text-[14px] font-semibold text-slate-950">
                  <span>Receipt Amount</span>
                  <span>{formatAmount(receipt?.amount)}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Amounts" icon={BadgeIndianRupee}>
            <div className="space-y-2 text-[12px] text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Settled Amount</span>
                <span className="text-right text-slate-900">
                  {formatAmount(
                    settlementDetails.reduce(
                      (total, item) => total + (Number(item?.settled_amount) || 0),
                      0,
                    ),
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Advance Amount</span>
                <span className="text-right text-slate-900">
                  {formatAmount(receipt?.advance_amount)}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
