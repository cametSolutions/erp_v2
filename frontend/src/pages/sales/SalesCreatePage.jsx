// src/features/sales/pages/SalesCreatePage.jsx
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  LoaderCircle,
  Package2,
  Pencil,
  Truck,
  User2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/api/client/apiClient";
import DespatchDetailsSheet from "@/components/DespatchDetailsSheet";
import PartySelectSheet from "@/components/PartySelectSheet";
import TransactionHeader from "@/components/TransactionHeader";
import ItemEditSheet from "@/components/sales/ItemEditSheet";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ROUTES } from "@/routes/paths";
import {
  setCompany,
  updateItem,
} from "@/store/slices/transactionSlice";

function formatCurrency(value) {
  return `Rs. ${(Number(value) || 0).toFixed(2)}`;
}

function SectionCard({
  title,
  required,
  subtitle,
  icon: Icon,
  tone = "slate",
  children,
}) {
  const tones = {
    slate: {
      icon: "border-slate-200 bg-slate-50 text-slate-700",
      card: "border-slate-200 bg-white",
    },
    blue: {
      icon: "border-sky-200 bg-sky-50 text-sky-700",
      card: "border-sky-100 bg-white",
    },
    amber: {
      icon: "border-amber-200 bg-amber-50 text-amber-700",
      card: "border-amber-100 bg-white",
    },
    teal: {
      icon: "border-teal-200 bg-teal-50 text-teal-700",
      card: "border-teal-100 bg-white",
    },
  };
  const currentTone = tones[tone] || tones.slate;

  return (
    <section
      className={`rounded-sm border ${currentTone.card} shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]`}
    >
      <header className="flex items-start justify-between border-b border-slate-100 px-3 py-3.5">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border ${currentTone.icon}`}
          >
            {Icon ? <Icon className="h-4.5 w-4.5" /> : null}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {title}
              {required && <span className="ml-1 text-rose-500">*</span>}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
      </header>
      <div className="px-3 py-4">{children}</div>
    </section>
  );
}

function PartySection() {
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
        className="rounded-xs!"
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
                  {party?.mobileNumber || party?.emailID || "Search and select customer"}
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

function DetailsSection() {
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
      despatch?.despatchThrough
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

function ItemsSection({ onCreate, createLoading, createError, disableCreate }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const items = useSelector((state) => state.transaction.items);
  const totals = useSelector((state) => state.transaction.totals);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemsSheetOpen, setItemsSheetOpen] = useState(false);
  const errorMessage =
    createError?.response?.data?.message ||
    createError?.message ||
    null;
  const editingItem =
    items.find((item) => item.id === editingItemId) || null;
  const previewItems = items.slice(0, 2);

  return (
    <>
      <SectionCard
        title="Items"
        required
        subtitle="Add products and quantities"
        icon={Package2}
        tone="teal"
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.salesSelectItems)}
            className="inline-flex w-full items-center justify-between rounded-xl border border-teal-600 bg-teal-600 px-3 py-3 text-xs font-medium text-white transition hover:bg-teal-700 hover:border-teal-700"
          >
            <span className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
                <Package2 className="h-3.5 w-3.5" />
              </span>
              <span className="flex flex-col text-left">
                <span className="text-sm font-semibold">Add Items</span>
                <span className="text-[11px] font-medium text-white/70">
                  Build the order line by line
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-[11px] text-white/85">
           
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>

          {items.length > 0 && (
            <div className="space-y-2">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Qty: {item.billedQty || 0} · Rate:{" "}
                        {(Number(item.rate) || 0).toFixed(2)} · Tax:{" "}
                        {(Number(item.taxRate) || 0).toFixed(2)}%
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Source: {item.initialPriceSource || "manual"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.totalAmount)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(item.id)}
                        className="mt-1 inline-flex items-center gap-1 rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-medium text-teal-700 transition hover:bg-teal-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setItemsSheetOpen(true)}
                className="inline-flex w-full items-center justify-between rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-3 text-xs font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50"
              >
                <span>View all items</span>
                <span className="inline-flex items-center gap-2 text-[11px] text-slate-500">
                  {items.length} item{items.length === 1 ? "" : "s"}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          )}

          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              No items added yet.
            </div>
          )}

          <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/70 to-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Order Summary
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {items.length} item{items.length === 1 ? "" : "s"} ready for billing
                </p>
              </div>
              <div className="rounded-xl border border-teal-200 bg-white px-3 py-2 text-right text-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Net Amount
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(totals?.finalAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-500">
              <div className="flex justify-between gap-6">
                <span>Sub total</span>
                <span className="tabular-nums">
                  {formatCurrency(totals?.subTotal)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span>Tax</span>
                <span className="tabular-nums">
                  {formatCurrency(totals?.totalIgstAmt)}
                </span>
              </div>
              <div className="flex justify-between gap-6 font-semibold text-slate-700">
                <span>Net amount</span>
                <span className="tabular-nums">
                  {formatCurrency(totals?.finalAmount)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreate}
            disabled={createLoading || disableCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Create Sales Order
          </button>

          {disableCreate && !createLoading && (
            <p className="text-xs text-amber-600">
              Wait for the transaction header to finish loading before creating the order.
            </p>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </SectionCard>

      <ItemEditSheet
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) setEditingItemId(null);
        }}
        item={editingItem}
        onSave={(changes) => {
          if (!editingItem) return;
          dispatch(updateItem({ id: editingItem.id, changes }));
        }}
      />

      <Sheet open={itemsSheetOpen} onOpenChange={setItemsSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-3xl"
        >
          <SheetHeader>
            <SheetTitle>All Items</SheetTitle>
            <SheetDescription>
              Review the full item list and edit individual rows.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Qty: {item.billedQty || 0} · Rate:{" "}
                      {(Number(item.rate) || 0).toFixed(2)} · Tax:{" "}
                      {(Number(item.taxRate) || 0).toFixed(2)}%
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Source: {item.initialPriceSource || "manual"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(item.totalAmount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setItemsSheetOpen(false);
                        setEditingItemId(item.id);
                      }}
                      className="mt-1 inline-flex items-center gap-1 rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-medium text-teal-700 transition hover:bg-teal-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function SalesCreatePage() {
  const cmpId = useSelector((state) => state.company.selectedCompanyId);
  const dispatch = useDispatch();
  const [buildHeaderPayload, setBuildHeaderPayload] = useState(null);

  useEffect(() => {
    if (!cmpId) return;

    dispatch(setCompany({ cmpId }));
  }, [cmpId, dispatch]);

  const createSaleOrderMutation = useMutation({
    mutationFn: async () => {
      const headerPayload = buildHeaderPayload ? buildHeaderPayload() : {};
      const payload = {
        ...headerPayload,
      };

      const res = await api.post("/api/sUsers/createSaleOrder", payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Sale order created", data);
      toast.success(data?.message || "Sales order created");
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create sales order";
      toast.error(message);
    },
  });

  const createLoading =
    createSaleOrderMutation.isPending || createSaleOrderMutation.isLoading;
  const headerReady = Boolean(buildHeaderPayload);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <TransactionHeader
        cmpId={cmpId}
        title="Order"
        numberField="salesOrderNumber"
        onHeaderReady={setBuildHeaderPayload}
      />

      <main className="flex-1 overflow-y-auto px-1 py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <PartySection />
          <DetailsSection />
          <ItemsSection
            onCreate={() => createSaleOrderMutation.mutate()}
            createLoading={createLoading}
            createError={createSaleOrderMutation.error}
            disableCreate={!cmpId || !headerReady}
          />
        </div>
      </main>
    </div>
  );
}
