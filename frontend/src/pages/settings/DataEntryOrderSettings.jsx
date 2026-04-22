import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, ScrollText } from "lucide-react";
import { toast } from "sonner";

import ErrorRetryState from "@/components/common/ErrorRetryState";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCompanySettingsMutation } from "@/hooks/mutations/useCompanySettingsMutation";
import { useCompanySettingsQuery } from "@/hooks/queries/companySettingsQueries";
import { DataEntryActionRow } from "@/pages/settings/DataEntrySettingsShared";

/**
 * Bottom sheet editor for Order Terms & Conditions data-entry defaults.
 *
 * Accepts:
 * - `open` / `onOpenChange`: sheet visibility control.
 * - `initialTerms`: saved terms array from company settings.
 * - `onSave`: async persistence callback.
 * - `isSaving`: save loading state for button UX.
 */
function OrderSettingsSheet({
  open,
  onOpenChange,
  initialTerms,
  onSave,
  isSaving,
}) {
  const [value, setValue] = useState("");

  // Re-hydrate editor text each time sheet opens from currently saved terms.
  useEffect(() => {
    if (open) {
      setValue((initialTerms || []).join("\n"));
    }
  }, [open, initialTerms]);

  // Derived read-only preview that mirrors what will be persisted.
  const previewLines = useMemo(
    () =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""),
    [value]
  );

  /**
   * Converts textarea content to normalized array payload and delegates save.
   *
   * Returns:
   * - Promise from `onSave`.
   */
  const handleSave = async () => {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    await onSave({
      dataEntry: {
        order: {
          termsAndConditions: lines,
        },
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[88vh] w-full flex-col gap-0 rounded-t-2xl p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="border-b border-slate-100 px-6 py-5">
            <SheetTitle>Order Settings</SheetTitle>
            <SheetDescription>
              Add one terms and conditions line per row for order entry.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Terms &amp; Conditions
              </label>
              <Textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Enter one term per line"
                className="min-h-48 resize-none"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-sm font-medium text-slate-900">Preview</div>
              {previewLines.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Terms will appear here as you type.
                </p>
              ) : (
                <div className="space-y-2 text-sm text-slate-700">
                  {previewLines.map((line, index) => (
                    <div key={`${index}-${line}`} className="flex gap-2">
                      <span className="font-medium text-slate-500">{index + 1}.</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="border-t border-slate-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Data-entry settings screen for Order module.
 *
 * Flow:
 * 1. Read company-scoped settings via query.
 * 2. Show current "terms" summary in action row.
 * 3. Open editor sheet, save via mutation, close on success.
 */
export default function DataEntryOrderSettings() {
  const cmp_id = useSelector((state) => state.company.selectedCompanyId) || "";
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    data: settings = {},
    isLoading,
    isError,
    error,
    refetch,
  } = useCompanySettingsQuery(cmp_id);
  const { mutateAsync, isPending } = useCompanySettingsMutation(cmp_id);
  const terms = settings?.dataEntry?.order?.termsAndConditions || [];

  /**
   * Shared save wrapper with company guard and success feedback.
   *
   * Accepts:
   * - Partial company-settings payload merged server-side.
   */
  const handleSave = async (payload) => {
    if (!cmp_id) {
      toast.error("Select a company first");
      return;
    }

    try {
      await mutateAsync(payload);
      toast.success("Settings saved successfully");
      setSheetOpen(false);
    } catch {
      // Toast handled in mutation hook.
    }
  };

  return (
    <div className="space-y-4 bg-white">
      {!cmp_id ? (
        <div className="rounded-sm border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Select a company to manage Order settings.
        </div>
      ) : isError ? (
        <ErrorRetryState
          message={
            error?.response?.data?.message ||
            error?.message ||
            "Failed to load order settings"
          }
          onRetry={() => refetch()}
        />
      ) : (
        <DataEntryActionRow
          title="Terms And Conditions"
          description={
            terms.length > 0
              ? `${terms.length} saved term${terms.length > 1 ? "s" : ""}`
              : "Add terms and conditions for order entry."
          }
          icon={ScrollText}
          onClick={() => setSheetOpen(true)}
        />
      )}

      <OrderSettingsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialTerms={terms}
        onSave={handleSave}
        isSaving={isPending}
      />

      {isLoading && cmp_id ? (
        <div className="text-xs text-slate-400">Loading saved settings...</div>
      ) : null}
    </div>
  );
}
