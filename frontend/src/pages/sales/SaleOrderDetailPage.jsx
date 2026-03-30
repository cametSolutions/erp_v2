import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, FileText, Printer, SquarePen, Truck, User2 } from "lucide-react";

import { useMobileHeader } from "@/components/Layout/HomeLayout";
import { Button } from "@/components/ui/button";
import { useSaleOrderDetailQuery } from "@/hooks/queries/saleOrderQueries";

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

function formatAmount(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function SummaryTile({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-900",
    blue: "border-sky-200 bg-sky-50 text-sky-950",
    teal: "border-teal-200 bg-teal-50 text-teal-950",
  };

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tones[tone] || tones.slate}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-semibold">{value}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
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

export default function SaleOrderDetailPage() {
  const { saleOrderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cmpId = useSelector((state) => state.company.selectedCompanyId);
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();

  const saleOrderFromState = location.state?.saleOrder || null;

  const { data, isLoading, isError, error } = useSaleOrderDetailQuery(
    saleOrderId,
    cmpId,
    {
      enabled: Boolean(saleOrderId),
      initialData: saleOrderFromState,
    },
  );

  const saleOrder = data || saleOrderFromState;

  useEffect(() => {
    setHeaderOptions({ showMenuDots: false });
    return () => resetHeaderOptions();
  }, [resetHeaderOptions, setHeaderOptions]);

  const totals = saleOrder?.totals || {};
  const items = saleOrder?.items || [];
  const additionalCharges = saleOrder?.additional_charges || [];
  const statusTone =
    saleOrder?.status === "converted"
      ? "bg-amber-100 text-amber-800"
      : saleOrder?.status === "cancelled"
        ? "bg-rose-100 text-rose-800"
        : "bg-emerald-100 text-emerald-800";

  const partyLines = useMemo(
    () =>
      [
        saleOrder?.party_snapshot?.billing_address,
        saleOrder?.party_snapshot?.shipping_address,
        saleOrder?.party_snapshot?.mobile,
        saleOrder?.party_snapshot?.gst_no,
      ].filter(Boolean),
    [saleOrder]
  );

  if (isLoading && !saleOrder) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
          />
        ))}
      </div>
    );
  }

  if (isError || !saleOrder) {
    return (
      <div className="mx-auto w-full max-w-xl p-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error?.response?.data?.message ||
            error?.message ||
            "Sale order details could not be loaded."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 p-4">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-4 py-4 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200/80">
              Sale Order
            </p>
            <h1 className="text-xl font-semibold tracking-[0.01em]">{saleOrder.voucher_number}</h1>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-100/90">
              <span>{formatDate(saleOrder.date)}</span>
              <span className="text-slate-300">•</span>
              <span>{saleOrder.party_snapshot?.name || "No party selected"}</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${statusTone}`}>
              {saleOrder.status || "open"}
            </span>
            <div className="text-left md:text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-200/75">
                Final Amount
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatAmount(totals.final_amount)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/25 bg-white/10 text-white hover:bg-white/15"
            onClick={() => navigate(`/sale-orders/${saleOrder._id}/edit`)}
          >
            <SquarePen className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile label="Party" value={saleOrder.party_snapshot?.name || "--"} tone="blue" />
        <SummaryTile label="Date" value={formatDate(saleOrder.date)} />
        <SummaryTile label="Amount" value={formatAmount(totals.final_amount)} tone="teal" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-3">
          <SectionCard title="Items" icon={FileText}>
            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">
                        {item.item_name}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Qty {item.billed_qty || 0} • Rate {Number(item.rate || 0).toFixed(2)} • Tax {Number(item.tax_rate || 0).toFixed(2)}%
                      </p>
                      {(item.description || item.hsn) && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {[item.hsn ? `HSN ${item.hsn}` : null, item.description].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </div>
                    <p className="text-[13px] font-semibold text-slate-900">
                      {formatAmount(item.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Additional Charges" icon={Truck}>
            {additionalCharges.length === 0 ? (
              <p className="text-sm text-slate-500">No additional charges.</p>
            ) : (
              <div className="space-y-2.5">
                {additionalCharges.map((charge) => (
                  <div key={charge._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">
                        {charge.option}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {charge.action} • Tax {Number(charge.tax_percentage || 0).toFixed(2)}%
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-900">
                      {formatAmount(charge.final_value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-3">
          <SectionCard title="Party Details" icon={User2}>
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-slate-900">
                {saleOrder.party_snapshot?.name || "--"}
              </p>
              {partyLines.length > 0 ? (
                partyLines.map((line) => (
                  <p key={line} className="text-[12px] text-slate-600">
                    {line}
                  </p>
                ))
              ) : (
                <p className="text-[12px] text-slate-500">No party details available.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Totals" icon={ArrowRight}>
            <div className="space-y-2 text-[12px]">
              {[
                ["Sub Total", totals.sub_total],
                ["Discount", totals.total_discount],
                ["Taxable Amount", totals.taxable_amount],
                ["Tax Amount", totals.total_tax_amount],
                ["IGST", totals.total_igst_amt],
                ["CGST", totals.total_cgst_amt],
                ["SGST", totals.total_sgst_amt],
                ["Additional Charge", totals.total_additional_charge],
                ["Round Off", totals.round_off],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900">
                    {formatAmount(value)}
                  </span>
                </div>
              ))}

              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between gap-4 text-[14px] font-semibold text-slate-950">
                  <span>Final Amount</span>
                  <span>{formatAmount(totals.final_amount)}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Despatch Details" icon={Truck}>
            <div className="space-y-2 text-[12px] text-slate-600">
              {[
                ["Challan No", saleOrder.despatch_details?.challan_no],
                ["Container No", saleOrder.despatch_details?.container_no],
                ["Despatch Through", saleOrder.despatch_details?.despatch_through],
                ["Destination", saleOrder.despatch_details?.destination],
                ["Vehicle No", saleOrder.despatch_details?.vehicle_no],
                ["Order No", saleOrder.despatch_details?.order_no],
                ["Terms Of Pay", saleOrder.despatch_details?.terms_of_pay],
                ["Terms Of Delivery", saleOrder.despatch_details?.terms_of_delivery],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-right text-slate-900">{value}</span>
                  </div>
                ))}

              {!Object.values(saleOrder.despatch_details || {}).some(Boolean) && (
                <p className="text-[12px] text-slate-500">No despatch details available.</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
