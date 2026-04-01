import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Building2,
  BadgePercent,
  Calculator,
  FileText,
  Landmark,
  ListChecks,
  PencilLine,
  ReceiptText,
  Scale,
  ScrollText,
  Signature,
  Sigma,
  Tag,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePrintConfigMutation } from "@/hooks/mutations/usePrintConfigMutation";
import { usePrintConfigQuery } from "@/hooks/queries/printConfigQueries";

const SAVE_STATUS_LABELS = {
  idle: "",
  saving: "Saving...",
  saved: "Saved",
};

const SALE_ORDER_FIELDS = [
  {
    key: "enable_company_details",
    label: "Company Details",
    description: "Show your business details in the print header.",
    icon: Building2,
  },
  {
    key: "enable_discount_column",
    label: "Discount Column",
    description: "Display the discount column in item rows.",
    icon: Tag,
  },
  // {
  //   key: "enable_discount_amount",
  //   label: "Discount Amount",
  //   description: "Show discount amount values in the totals section.",
  //   icon: BadgePercent,
  // },
  {
    key: "enable_hsn",
    label: "HSN",
    description: "Include HSN code details for each item.",
    icon: FileText,
  },
  {
    key: "enable_tax_percentage",
    label: "Tax Percentage",
    description: "Display tax percentage beside item values.",
    icon: BadgePercent,
  },
  // {
  //   key: "enable_incl_tax_rate",
  //   label: "Inclusive Tax Rate",
  //   description: "Show rates that already include tax.",
  //   icon: Calculator,
  // },
  // {
  //   key: "enable_tax_analysis",
  //   label: "Tax Analysis",
  //   description: "Add a tax analysis block below the item table.",
  //   icon: Sigma,
  // },
  {
    key: "enable_stock_wise_tax_amount",
    label: "Stock-wise Tax Amount",
    description: "Show tax amounts item by item.",
    icon: ListChecks,
  },
  {
    key: "enable_tax_amount",
    label: "Tax Amount",
    description: "Display total tax amount in the summary.",
    icon: Calculator,
  },
  // {
  //   key: "enable_terms_conditions",
  //   label: "Terms & Conditions",
  //   description: "Include terms and conditions in the footer.",
  //   icon: ScrollText,
  // },
  // {
  //   key: "enable_bank_details",
  //   label: "Bank Details",
  //   description: "Show bank account details for payment reference.",
  //   icon: Landmark,
  // },
  {
    key: "enable_rate",
    label: "Rate",
    description: "Display item rate in the print layout.",
    icon: Scale,
  },
  {
    key: "enable_quantity",
    label: "Quantity",
    description: "Display quantity for each line item.",
    icon: ListChecks,
  },
  // {
  //   key: "enable_stock_wise_amount",
  //   label: "Stock-wise Amount",
  //   description: "Show line amount for each item row.",
  //   icon: Calculator,
  // },
  {
    key: "enable_net_amount",
    label: "Net Amount",
    description: "Display the final net amount in totals.",
    icon: Wallet,
  },
];

const RECEIPT_FIELDS = [
  {
    key: "enable_company_details",
    label: "Company Details",
    description: "Show your business details on the receipt.",
    icon: Building2,
  },
  {
    key: "enable_party_details",
    label: "Party Details",
    description: "Display customer or party information clearly.",
    icon: ReceiptText,
  },
  {
    key: "enable_payment_mode",
    label: "Payment Mode",
    description: "Include the selected payment mode.",
    icon: Wallet,
  },
  {
    key: "enable_received_amount",
    label: "Received Amount",
    description: "Show the amount received from the party.",
    icon: Calculator,
  },
  {
    key: "enable_balance_due",
    label: "Balance Due",
    description: "Display remaining balance after receipt.",
    icon: Scale,
  },
  {
    key: "enable_narration",
    label: "Narration",
    description: "Include narration or notes in the receipt.",
    icon: FileText,
  },
  {
    key: "enable_terms_conditions",
    label: "Terms & Conditions",
    description: "Show terms and conditions on the receipt.",
    icon: ScrollText,
  },
  {
    key: "enable_bank_details",
    label: "Bank Details",
    description: "Display bank details when needed.",
    icon: Landmark,
  },
  {
    key: "enable_authorized_signature",
    label: "Authorized Signature",
    description: "Reserve space for an authorized signature.",
    icon: Signature,
  },
];

const CONFIG_FIELDS_BY_TYPE = {
  sale_order: SALE_ORDER_FIELDS,
  receipt: RECEIPT_FIELDS,
};

const TITLES = {
  sale_order: "Sale Order",
  receipt: "Receipt",
};

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
        />
      ))}
    </div>
  );
}

function SettingRow({
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  action,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>

      {action ? (
        action
      ) : (
        <Switch
          checked={Boolean(checked)}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={label}
        />
      )}
    </div>
  );
}

function PrintConfigDetail({ voucherType }) {
  const cmp_id = useSelector((state) => state.company.selectedCompanyId);

  // Dialog + save status state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");

  // Refs to accumulate changes and debounce network calls
  const pendingChangesRef = useRef({});
  const debounceTimeoutRef = useRef(null);
  const savedLabelTimeoutRef = useRef(null);

  const { data, isLoading, error } = usePrintConfigQuery(cmp_id, voucherType);
  const { mutateAsync } = usePrintConfigMutation(cmp_id, voucherType);
  const config = data?.config;

  const fields = CONFIG_FIELDS_BY_TYPE[voucherType] || [];
  const voucherLabel = TITLES[voucherType] || "Voucher";

  // Clear "Saved" label after a short delay
  const clearSavedStateLater = useCallback(() => {
    if (savedLabelTimeoutRef.current) {
      window.clearTimeout(savedLabelTimeoutRef.current);
    }
    savedLabelTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus("idle");
    }, 1200);
  }, []);

  // Flush accumulated changes to the server
  const flushPendingChanges = useCallback(async () => {
    if (!cmp_id) return;

    const partial = pendingChangesRef.current;
    if (!Object.keys(partial).length) return;

    pendingChangesRef.current = {};
    setSaveStatus("saving");

    try {
      await mutateAsync(partial);
      setSaveStatus("saved");
      clearSavedStateLater();
    } catch {
      // On error drop pending changes; TanStack mutation should revert cache
      pendingChangesRef.current = {};
      setSaveStatus("idle");
      return;
    }

    // If new changes arrived while saving, schedule another flush
    if (Object.keys(pendingChangesRef.current).length) {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        flushPendingChanges();
      }, 300);
    }
  }, [clearSavedStateLater, cmp_id, mutateAsync]);

  // Debounced trigger for flush
  const scheduleSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = window.setTimeout(() => {
      flushPendingChanges();
    }, 300);
  }, [flushPendingChanges]);

  // Helper used by switches and dialog
  const updateConfig = useCallback(
    (partial) => {
      if (!partial || !Object.keys(partial).length) return;

      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        ...partial,
      };
      setSaveStatus("saving");
      scheduleSave();
    },
    [scheduleSave],
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      if (savedLabelTimeoutRef.current) {
        window.clearTimeout(savedLabelTimeoutRef.current);
      }
    };
  }, []);

  // Reset pending state when company or voucher changes
  useEffect(() => {
    pendingChangesRef.current = {};
    setSaveStatus("idle");
  }, [cmp_id, voucherType]);

  // Load current title into dialog draft when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setTitleDraft(config?.print_title || "");
    }
  }, [config?.print_title, isDialogOpen]);

  const statusLabel = useMemo(
    () => SAVE_STATUS_LABELS[saveStatus] || "",
    [saveStatus],
  );

  if (!cmp_id) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Print Configuration ({voucherLabel})
        </h2>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Please select a company
        </div>
      </section>
    );
  }

  if (isLoading) {
    return <LoadingRows />;
  }

  if (error) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Print Configuration ({voucherLabel})
        </h2>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error?.response?.data?.message || "Failed to load configuration"}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p
          className={`pt-1 text-xs font-medium ${
            saveStatus === "saving" ? "text-slate-500" : "text-emerald-600"
          }`}
        >
          {statusLabel}
        </p>
      </div>

      <Card className="border-none bg-white shadow-sm ring-0">
        <CardContent className="px-4 py-0">
          <div className="divide-y divide-slate-100">
            {/* Print title row with dialog */}
            <SettingRow
              icon={PencilLine}
              label="Print Title"
              description="Update the title shown on the print."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Edit
                </Button>
              }
            />

            {/* Toggle for showing print title */}
            <SettingRow
              icon={FileText}
              label="Show Print Title"
              description="Display the print title at the top of the document."
              checked={config?.show_print_title}
              onCheckedChange={(checked) =>
                updateConfig({ show_print_title: checked })
              }
            />

            {/* Voucher-specific fields */}
            {fields.map((field) => (
              <SettingRow
                key={field.key}
                icon={field.icon}
                label={field.label}
                description={field.description}
                checked={config?.[field.key]}
                onCheckedChange={(checked) =>
                  updateConfig({ [field.key]: checked })
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog to edit print title */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Print Title</DialogTitle>
            <DialogDescription>
              Update the title shown on the print.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            placeholder="Enter print title"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTitleDraft(config?.print_title || "");
                setIsDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                updateConfig({
                  print_title: titleDraft.trim() || voucherLabel,
                });
                setIsDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default PrintConfigDetail;