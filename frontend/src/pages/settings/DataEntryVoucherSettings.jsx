import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BadgeIndianRupee,
  Check,
  ChevronDown,
  Loader2,
  Rows3,
} from "lucide-react";
import { toast } from "sonner";

import ErrorRetryState from "@/components/common/ErrorRetryState";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCompanySettingsMutation } from "@/hooks/mutations/useCompanySettingsMutation";
import { useCompanySettingsQuery } from "@/hooks/queries/companySettingsQueries";
import { usePartyListQuery } from "@/hooks/queries/partyQueries";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/paths";
import { DataEntryActionRow } from "@/pages/settings/DataEntrySettingsShared";

/**
 * Bottom sheet that allows selecting default bank account for voucher entry.
 *
 * Accepts:
 * - `cmp_id`: active company id used to fetch bank-type parties.
 * - `savedBank`: currently persisted bank object (if any).
 * - `onSave`: async callback that writes selected bank id.
 * - standard sheet controls (`open`, `onOpenChange`) + `isSaving`.
 */
function VoucherSettingsSheet({
  open,
  onOpenChange,
  cmp_id,
  savedBank,
  onSave,
  isSaving,
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");

  // Reset transient selector state every time sheet opens.
  useEffect(() => {
    if (open) {
      setSelectedBankId(savedBank?._id || "");
      setSearch("");
      setPopoverOpen(false);
    }
  }, [open, savedBank]);

  // Fetch only bank parties; this list backs default bank picker.
  const {
    data: bankData,
    isLoading: isBankLoading,
    isError: isBankError,
    error: bankError,
    refetch: refetchBanks,
  } = usePartyListQuery({
    cmp_id,
    page: 1,
    limit: 1000,
    search: "",
    partyType: "bank",
    enabled: open && Boolean(cmp_id),
  });

  const banks = bankData?.items || [];
  // Client-side search filter over already fetched bank list.
  const filteredBanks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return banks;

    return banks.filter((bank) =>
      [bank?.partyName, bank?.bank_name, bank?.ac_no, bank?.ifsc].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [banks, search]);

  const selectedBank =
    banks.find((bank) => bank._id === selectedBankId) ||
    (savedBank?._id === selectedBankId ? savedBank : null);

  const selectedLabel = selectedBank
    ? `${selectedBank.partyName || "Untitled Bank"}${selectedBank.bank_name ? ` - ${selectedBank.bank_name}` : ""}${selectedBank.ac_no ? ` (${selectedBank.ac_no})` : ""}`
    : "Select bank account";

  /**
   * Persists selected bank id in company data-entry voucher settings.
   * `null` means no default bank should be auto-selected.
   */
  const handleSave = async () => {
    await onSave({
      dataEntry: {
        voucher: {
          defaultBankAccountId: selectedBankId || null,
        },
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[88vh] w-full flex-col gap-0 rounded-t-2xl p-0"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="border-b border-slate-100 px-6 py-5">
            <SheetTitle>Voucher Settings</SheetTitle>
            <SheetDescription>
              Choose the bank account to prefill for voucher entry.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Default Bank Account
              </label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-between border-slate-200 px-3 text-left font-normal text-slate-900"
                  >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  portalled={false}
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                >
                  <Command>
                    {/* <CommandInput
                      placeholder="Search bank accounts..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    /> */}
                    <CommandList>
                      {isBankLoading ? (
                        <div className="flex items-center justify-center px-3 py-8 text-sm text-slate-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading bank accounts...
                        </div>
                      ) : isBankError ? (
                        <ErrorRetryState
                          message={
                            bankError?.response?.data?.message ||
                            bankError?.message ||
                            "Failed to load bank accounts"
                          }
                          onRetry={() => refetchBanks()}
                        />
                      ) : filteredBanks.length === 0 ? (
                        <CommandEmpty>No bank accounts found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          <CommandItem
                            onClick={() => {
                              setSelectedBankId("");
                              setPopoverOpen(false);
                            }}
                            data-selected={!selectedBankId}
                          >
                            <Check
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0",
                                !selectedBankId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="min-w-0">
                              <div className="font-medium">No default bank account</div>
                              <div className="text-xs text-slate-500">
                                Leave voucher bank selection empty by default.
                              </div>
                            </div>
                          </CommandItem>
                          {filteredBanks.map((bank) => {
                            const isSelected = bank._id === selectedBankId;

                            return (
                              <CommandItem
                                key={bank._id}
                                onClick={() => {
                                  setSelectedBankId(bank._id);
                                  setPopoverOpen(false);
                                }}
                                data-selected={isSelected}
                              >
                                <Check
                                  className={cn(
                                    "mt-0.5 h-4 w-4 shrink-0",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {bank.partyName || "Untitled Bank"}
                                    {bank.bank_name ? ` - ${bank.bank_name}` : ""}
                                  </div>
                                  <div className="truncate text-xs text-slate-500">
                                    {bank.ac_no ? `A/c ${bank.ac_no}` : "No account number"}
                                    {bank.ifsc ? ` • IFSC ${bank.ifsc}` : ""}
                                  </div>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
 * Data-entry settings page for voucher module.
 *
 * Responsibilities:
 * - Navigation entry to Voucher Series settings.
 * - Default bank account preference editor.
 */
export default function DataEntryVoucherSettings() {
  const navigate = useNavigate();
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

  const selectedBank = settings?.dataEntry?.voucher?.defaultBankAccountId || null;

  /**
   * Writes partial settings payload and closes sheet on success.
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
          Select a company to manage Voucher settings.
        </div>
      ) : isError ? (
        <ErrorRetryState
          message={
            error?.response?.data?.message ||
            error?.message ||
            "Failed to load voucher settings"
          }
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-3">
          <DataEntryActionRow
            title="Voucher Series"
            description="Open sale order and receipt voucher series settings."
            icon={Rows3}
            onClick={() => navigate(ROUTES.settingsVoucherSeries)}
          />
          <DataEntryActionRow
            title="Select Bank Account"
            description="Choose the default bank account for voucher entry."
            icon={BadgeIndianRupee}
            onClick={() => setSheetOpen(true)}
          />
        </div>
      )}

      <VoucherSettingsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        cmp_id={cmp_id}
        savedBank={selectedBank}
        onSave={handleSave}
        isSaving={isPending}
      />

      {isLoading && cmp_id ? (
        <div className="text-xs text-slate-400">Loading saved settings...</div>
      ) : null}
    </div>
  );
}
