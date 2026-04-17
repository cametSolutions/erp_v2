import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeIndianRupee,
  Building2,
  CreditCard,
  Landmark,
  ReceiptText,
  User2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { cashTransactionService } from "@/api/services/cashTransaction.service";
import PartySelectSheet from "@/components/PartySelectSheet";
import TransactionHeader from "@/components/TransactionHeader";
import ErrorRetryState from "@/components/common/ErrorRetryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCashTransaction } from "@/hooks/mutations/useCreateCashTransaction";
import { useSettlementOutstandingQuery } from "@/hooks/queries/outstandingQueries";
import { ROUTES } from "@/routes/paths";
import { setCompany, setVoucherType } from "@/store/slices/transactionSlice";
import calculateAutoSettlement from "@/utils/calculateAutoSettlement";
import { useMobileHeader } from "@/components/Layout/HomeLayout";

function getReceiptDraftStorageKey(cmp_id, voucher_type) {
  return `cash-transaction-draft-${voucher_type || "receipt"}-${cmp_id || "default"}`;
}

function formatCurrency(value) {
  return `Rs. ${(Number(value) || 0).toFixed(2)}`;
}

function formatDateLabel(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DetailCard({ title, subtitle, icon: Icon, tone = "blue", children }) {
  const tones = {
    blue: {
      card: "border-sky-100",
      icon: "border-sky-200 bg-sky-50 text-sky-700",
    },
    amber: {
      card: "border-amber-100",
      icon: "border-amber-200 bg-amber-50 text-amber-700",
    },
    teal: {
      card: "border-teal-100",
      icon: "border-teal-200 bg-teal-50 text-teal-700",
    },
  };
  const currentTone = tones[tone] || tones.blue;

  return (
    <section
      className={`rounded-sm border ${currentTone.card} bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]`}
    >
      <header className="flex items-start gap-3 border-b border-slate-100 px-3 py-3.5">
        <span
          className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border ${currentTone.icon}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </header>
      <div className="px-3 py-4">{children}</div>
    </section>
  );
}

function getRemainingAmountToAllocate(amount, bills = [], excludeBillId = null) {
  const allocatedAmount = bills.reduce((total, bill) => {
    if (excludeBillId && bill._id === excludeBillId) {
      return total;
    }

    return total + (Number(bill?.settled_amount) || 0);
  }, 0);

  return Math.max((Number(amount) || 0) - allocatedAmount, 0);
}

function redistributeCheckedBills(bills = [], amount = 0) {
  let remaining = Number(amount) || 0;

  return bills.map((bill) => {
    if (!bill.checked) {
      return {
        ...bill,
        settled_amount: 0,
      };
    }

    const pendingAmount = Number(bill?.bill_pending_amt) || 0;
    const settledAmount = Math.min(remaining, pendingAmount);
    remaining -= settledAmount;

    return {
      ...bill,
      checked: settledAmount > 0,
      settled_amount: settledAmount,
    };
  });
}

function AmountSettlementStep({
  voucher_type,
  party,
  amount,
  setAmount,
  bills,
  setBills,
  onContinue,
  onBack,
  isLoading,
  isError,
  error,
  refetch,
}) {
  const totalOutstanding = useMemo(
    () =>
      bills.reduce((total, bill) => total + (Number(bill?.bill_pending_amt) || 0), 0),
    [bills]
  );
  const settledBills = bills.filter(
    (bill) => bill.checked && (Number(bill?.settled_amount) || 0) > 0
  );
  const settledAmount = settledBills.reduce(
    (total, bill) => total + (Number(bill?.settled_amount) || 0),
    0
  );
  const advanceAmount = Math.max((Number(amount) || 0) - settledAmount, 0);

  const handleAmountChange = (event) => {
    const nextAmount = Number(event.target.value) || 0;
    setAmount(nextAmount);
    setBills((currentBills) => calculateAutoSettlement(nextAmount, currentBills));
  };

  const handleToggleBill = (billId, checked) => {
    const remainingAmount = getRemainingAmountToAllocate(amount, bills, billId);

    if (checked && remainingAmount <= 0) {
      return;
    }

    setBills((currentBills) => {
      const updatedBills = currentBills.map((bill) => {
        if (bill._id !== billId) return bill;

        const pendingAmount = Number(bill?.bill_pending_amt) || 0;
        const settledAmount = checked
          ? Math.min(remainingAmount, pendingAmount)
          : 0;

        return {
          ...bill,
          checked: checked && settledAmount > 0,
          settled_amount: settledAmount,
        };
      });

      return redistributeCheckedBills(updatedBills, amount);
    });
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 px-1">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{party?.partyName || "Party"}</p>
            <p className="text-xs text-slate-500">
              {voucher_type === "payment" ? "Payment settlement" : "Receipt settlement"}
            </p>
          </div>
          <Button onClick={onContinue} disabled={(Number(amount) || 0) <= 0}>
            Continue
          </Button>
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto py-4"
        data-route-scroll-reset="true"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <DetailCard
            title="Settlement"
            subtitle="Enter amount and review settlement against outstanding bills"
            icon={BadgeIndianRupee}
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{party?.partyName || "--"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Total Outstanding {formatCurrency(totalOutstanding)}
                </p>
                {advanceAmount > 0 ? (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    Advance Amount {formatCurrency(advanceAmount)}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  {voucher_type === "payment" ? "Payment Amount" : "Receipt Amount"}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount || ""}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="h-12 text-lg font-semibold"
                />
              </div>
            </div>
          </DetailCard>

          <DetailCard
            title="Outstanding Bills"
            subtitle="Bills are auto-settled oldest first and can still be adjusted manually"
            icon={ReceiptText}
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                  />
                ))}
              </div>
            ) : isError ? (
              <ErrorRetryState
                message={
                  error?.response?.data?.message ||
                  error?.message ||
                  "Failed to load outstanding bills"
                }
                onRetry={refetch}
              />
            ) : bills.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No outstanding bills found for this party.
              </div>
            ) : (
              <div className="space-y-3">
                {bills.map((bill) => {
                  const pendingAmount = Number(bill?.bill_pending_amt) || 0;
                  const settledAmountForBill = Number(bill?.settled_amount) || 0;
                  const remainingAmount = Math.max(pendingAmount - settledAmountForBill, 0);
                  const remainingToAllocate = getRemainingAmountToAllocate(
                    amount,
                    bills,
                    bill._id
                  );
                  const disableTick = !bill.checked && remainingToAllocate <= 0;

                  return (
                    <label
                      key={bill._id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(bill.checked)}
                        disabled={disableTick}
                        onChange={(event) =>
                          handleToggleBill(bill._id, event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {bill.bill_no || "Bill"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateLabel(bill.bill_date)}
                          </p>
                        </div>
                        <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                          <p>Bill Amount {formatCurrency(bill.bill_pending_amt)}</p>
                          <p>Settled {formatCurrency(settledAmountForBill)}</p>
                          <p>Remaining {formatCurrency(remainingAmount)}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </DetailCard>
        </div>
      </main>
    </div>
  );
}

export default function CashTransactionScreen({ voucher_type = "receipt" }) {
  const cmp_id = useSelector((state) => state.company.selectedCompanyId);
  const transactionDate = useSelector((state) => state.transaction.transactionDate);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const [buildHeaderPayload, setBuildHeaderPayload] = useState(null);
  const [party, setParty] = useState(null);
  const [cashBank, setCashBank] = useState(null);
  const [partySheetOpen, setPartySheetOpen] = useState(false);
  const [cashBankSheetOpen, setCashBankSheetOpen] = useState(false);
  const [instrumentType, setInstrumentType] = useState("cash");
  const [amount, setAmount] = useState(0);
  const [bills, setBills] = useState([]);
  const [settlementDetails, setSettlementDetails] = useState([]);
  const [narration, setNarration] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState(null);
  const [step, setStep] = useState("main");
  const draftStorageKey = getReceiptDraftStorageKey(cmp_id, voucher_type);

  useEffect(() => {
    if (!cmp_id) return;
    dispatch(setCompany({ cmp_id }));
  }, [cmp_id, dispatch]);

  useEffect(() => {
    dispatch(setVoucherType(voucher_type));

    return () => {
      dispatch(setVoucherType("saleOrder"));
    };
  }, [dispatch, voucher_type]);

  useEffect(() => {
    if (instrumentType === "cash") {
      setChequeNumber("");
      setChequeDate(null);
    }

    setCashBank(null);
  }, [instrumentType]);

  useEffect(() => {
    setHeaderOptions({
      onBack: step === "settlement" ? () => setStep("main") : undefined,
    });

    return () => resetHeaderOptions();
  }, [resetHeaderOptions, setHeaderOptions, step]);

  useEffect(() => {
    if (!cmp_id) return;

    try {
      const rawDraft = localStorage.getItem(draftStorageKey);
      if (!rawDraft) return;

      const draft = JSON.parse(rawDraft);

      setParty(draft?.party || null);
      setCashBank(draft?.cashBank || null);
      setInstrumentType(draft?.instrumentType || "cash");
      setAmount(Number(draft?.amount) || 0);
      setBills(Array.isArray(draft?.bills) ? draft.bills : []);
      setSettlementDetails(
        Array.isArray(draft?.settlementDetails) ? draft.settlementDetails : []
      );
      setNarration(draft?.narration || "");
      setChequeNumber(draft?.chequeNumber || "");
      setChequeDate(draft?.chequeDate ? new Date(draft.chequeDate) : null);
      setStep(draft?.step || "main");
    } catch (error) {
      console.error("Failed to hydrate cash transaction draft", error);
    }
  }, [cmp_id, draftStorageKey]);

  useEffect(() => {
    if (!cmp_id) return;

    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          party,
          cashBank,
          instrumentType,
          amount,
          bills,
          settlementDetails,
          narration,
          chequeNumber,
          chequeDate: chequeDate ? chequeDate.toISOString() : null,
          step,
        })
      );
    } catch (error) {
      console.error("Failed to persist cash transaction draft", error);
    }
  }, [
    amount,
    bills,
    cashBank,
    chequeDate,
    chequeNumber,
    cmp_id,
    draftStorageKey,
    instrumentType,
    narration,
    party,
    settlementDetails,
    step,
  ]);

  const outstandingClassification = voucher_type === "receipt" ? "dr" : "cr";
  const outstandingQuery = useSettlementOutstandingQuery({
    partyId: party?._id || "",
    cmp_id,
    classification: outstandingClassification,
    enabled: Boolean(party?._id) && step === "settlement",
  });

  useEffect(() => {
    if (!outstandingQuery.data?.items) return;
    setBills(calculateAutoSettlement(amount, outstandingQuery.data.items));
  }, [amount, outstandingQuery.data]);

  const createCashTransactionMutation = useCreateCashTransaction({
    cmp_id,
    voucher_type,
    onSuccess: async (data) => {
      const cashTransaction = data?.data?.cashTransaction;

      if (cashTransaction?._id) {
        try {
          localStorage.removeItem(draftStorageKey);
        } catch (error) {
          console.error("Failed to clear cash transaction draft", error);
        }

        navigate(
          ROUTES.transactionDetail
            .replace(":voucherType", voucher_type)
            .replace(":voucherId", cashTransaction._id),
          {
            state: {
              transaction: cashTransaction,
              voucherType: voucher_type,
            },
          }
        );
      }
    },
  });

  const selectedSettlementCount = settlementDetails.length;
  const selectedSettlementAmount = settlementDetails.reduce(
    (total, item) => total + (Number(item?.settled_amount) || 0),
    0
  );
  const advanceAmount = Math.max((Number(amount) || 0) - selectedSettlementAmount, 0);
  const title = voucher_type === "payment" ? "Create Payment" : "Create Receipt";
  const amountLabel = voucher_type === "payment" ? "Payment Amount" : "Receipt Amount";
  const actionLabel = voucher_type === "payment" ? "Create Payment" : "Create Receipt";
  const partyOutstandingFilter =
    voucher_type === "payment" ? "payable" : "receivable";
  const cashBankLabel = instrumentType === "cash" ? "Cash Account" : "Bank Account";
  const cashBankType = instrumentType === "cash" ? "cash" : "bank";
  const createLoading =
    createCashTransactionMutation.isPending || createCashTransactionMutation.isLoading;
  const createErrorMessage =
    createCashTransactionMutation.error?.response?.data?.message ||
    createCashTransactionMutation.error?.message ||
    null;
  const disableCreate =
    !cmp_id ||
    !buildHeaderPayload ||
    !party?._id ||
    !cashBank?._id ||
    (Number(amount) || 0) <= 0 ||
    (instrumentType === "cheque" && (!chequeNumber || !chequeDate));

  const handleContinueFromSettlement = () => {
    const nextSettlementDetails = bills
      .filter((bill) => bill.checked && (Number(bill?.settled_amount) || 0) > 0)
      .map((bill) => {
        const previousOutstandingAmount = Number(bill?.bill_pending_amt) || 0;
        const settledAmount = Number(bill?.settled_amount) || 0;

        return {
          outstanding: bill._id,
          outstanding_number: bill.bill_no || "",
          outstanding_date: bill.bill_date,
          outstanding_type: bill.classification || outstandingClassification,
          previous_outstanding_amount: previousOutstandingAmount,
          settled_amount: settledAmount,
          remaining_outstanding_amount: Math.max(
            previousOutstandingAmount - settledAmount,
            0
          ),
          settlement_date: transactionDate || new Date().toISOString(),
        };
      });

    setSettlementDetails(nextSettlementDetails);
    setStep("main");
  };

  const handleCreate = () => {
    const headerPayload = buildHeaderPayload ? buildHeaderPayload() : {};
    const payload = cashTransactionService.buildCreateCashTransactionPayload({
      cmp_id,
      voucher_type,
      party,
      cashBank,
      instrumentType,
      amount,
      settlementDetails,
      narration,
      chequeNumber,
      chequeDate: chequeDate ? chequeDate.toISOString() : null,
      headerPayload,
    });

    createCashTransactionMutation.mutate(payload);
  };

  if (step === "settlement") {
    return (
      <AmountSettlementStep
        voucher_type={voucher_type}
        party={party}
        amount={amount}
        setAmount={setAmount}
        bills={bills}
        setBills={setBills}
        onContinue={handleContinueFromSettlement}
        onBack={() => setStep("main")}
        isLoading={outstandingQuery.isLoading}
        isError={outstandingQuery.isError}
        error={outstandingQuery.error}
        refetch={outstandingQuery.refetch}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 ">
      <TransactionHeader
        cmp_id={cmp_id}
        title={title}
        numberField={voucher_type === "payment" ? "paymentNumber" : "receiptNumber"}
        onHeaderReady={setBuildHeaderPayload}
        voucherTypeOverride={voucher_type}
      />

      <main
        className="flex-1 overflow-y-auto px-3 py-4"
        data-route-scroll-reset="true"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <DetailCard
            title="Party"
            subtitle="Use the same party selection flow as sale order"
            icon={User2}
            tone="blue"
          >
            <button
              type="button"
              onClick={() => setPartySheetOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-sky-200 bg-sky-50/40 px-3 py-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {party?.partyName || "Add Party Name"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Search and select party</p>
              </div>
              <p className="text-xs font-medium text-sky-700">Select</p>
            </button>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  {amountLabel}
                </label>
                <div className="flex gap-2">
                  <Input value={amount || ""} readOnly placeholder="0.00" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("settlement")}
                    disabled={!party?._id}
                  >
                    Enter Amount
                  </Button>
                </div>
              </div>

              {selectedSettlementCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep("settlement")}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700"
                >
                  {formatCurrency(selectedSettlementAmount)} | {selectedSettlementCount} bills settled
                </button>
              ) : null}
            </div>
            
            {advanceAmount > 0 ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                Advance Amount {formatCurrency(advanceAmount)}
              </div>
            ) : null}
          </DetailCard>

          <DetailCard
            title="Instrument"
            subtitle="Choose payment mode and cash or bank account"
            icon={CreditCard}
            tone="amber"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "cash", label: "Cash" },
                  { value: "cheque", label: "Cheque" },
                  { value: "upi", label: "UPI" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInstrumentType(option.value)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      instrumentType === option.value
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCashBankSheetOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                    {cashBankType === "cash" ? (
                      <Landmark className="h-4 w-4" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {cashBank?.partyName || `Select ${cashBankLabel}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {cashBank?.bank_name || cashBank?.ac_no || `Choose a ${cashBankType} ledger`}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-500">Select</p>
              </button>

              {instrumentType === "cheque" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Cheque Number
                    </label>
                    <Input
                      value={chequeNumber}
                      onChange={(event) => setChequeNumber(event.target.value)}
                      placeholder="Enter cheque number"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Cheque Date
                    </label>
                    <Input
                      type="date"
                      value={chequeDate ? new Date(chequeDate).toISOString().slice(0, 10) : ""}
                      onChange={(event) =>
                        setChequeDate(event.target.value ? new Date(event.target.value) : null)
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </DetailCard>

          <DetailCard
            title="Narration"
            subtitle="Optional notes for this transaction"
            icon={ReceiptText}
            tone="teal"
          >
            <Textarea
              value={narration}
              onChange={(event) => setNarration(event.target.value)}
              placeholder="Add narration"
              className="min-h-24"
            />
          </DetailCard>

          <div className="sticky bottom-0 z-10 -mx-3 border-t border-slate-200 bg-white px-3 py-3">
           
            <Button
              onClick={handleCreate}
              disabled={disableCreate || createLoading}
              className="h-11 w-full rounded-xl bg-sky-500 text-sm font-semibold text-white shadow-md shadow-sky-200 hover:bg-sky-600"
            >
              {createLoading ? "Saving..." : actionLabel}
            </Button>
          </div>
        </div>
      </main>

      <PartySelectSheet
        open={partySheetOpen}
        onOpenChange={setPartySheetOpen}
        title="Select Party"
        outstandingFilter={partyOutstandingFilter}
        onSelectParty={setParty}
      />

      <PartySelectSheet
        open={cashBankSheetOpen}
        onOpenChange={setCashBankSheetOpen}
        title={`Select ${cashBankLabel}`}
        partyType={cashBankType}
        onSelectParty={setCashBank}
      />
    </div>
  );
}
