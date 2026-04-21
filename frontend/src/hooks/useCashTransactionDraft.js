import { useCallback, useEffect, useMemo, useState } from "react";

function getReceiptDraftStorageKey(cmp_id, voucher_type) {
  return `cash-transaction-draft-${voucher_type || "receipt"}-${cmp_id || "default"}`;
}

function createDefaultDraft() {
  return {
    transactionDate: new Date().toISOString(),
    selectedSeries: null,
    party: null,
    cashBank: null,
    instrumentType: "cash",
    amount: 0,
    bills: [],
    settlementDetails: [],
    narration: "",
    chequeNumber: "",
    chequeDate: null,
    step: "main",
  };
}

export function useCashTransactionDraft({ cmp_id, voucher_type }) {
  const draftStorageKey = useMemo(
    () => getReceiptDraftStorageKey(cmp_id, voucher_type),
    [cmp_id, voucher_type],
  );
  const [hasHydrated, setHasHydrated] = useState(false);
  const [transactionDate, setTransactionDate] = useState(
    () => createDefaultDraft().transactionDate,
  );
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [party, setParty] = useState(null);
  const [cashBank, setCashBank] = useState(null);
  const [instrumentType, setInstrumentType] = useState("cash");
  const [amount, setAmount] = useState(0);
  const [bills, setBills] = useState([]);
  const [settlementDetails, setSettlementDetails] = useState([]);
  const [narration, setNarration] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState(null);
  const [step, setStep] = useState("main");

  const resetDraftState = useCallback(() => {
    const nextDraft = createDefaultDraft();
    setTransactionDate(nextDraft.transactionDate);
    setSelectedSeries(nextDraft.selectedSeries);
    setParty(nextDraft.party);
    setCashBank(nextDraft.cashBank);
    setInstrumentType(nextDraft.instrumentType);
    setAmount(nextDraft.amount);
    setBills(nextDraft.bills);
    setSettlementDetails(nextDraft.settlementDetails);
    setNarration(nextDraft.narration);
    setChequeNumber(nextDraft.chequeNumber);
    setChequeDate(nextDraft.chequeDate);
    setStep(nextDraft.step);
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftStorageKey);
    } catch (error) {
      console.error("Failed to clear cash transaction draft", error);
    }

    resetDraftState();
  }, [draftStorageKey, resetDraftState]);

  useEffect(() => {
    setHasHydrated(false);

    if (!cmp_id) {
      resetDraftState();
      setHasHydrated(true);
      return;
    }

    try {
      const rawDraft = localStorage.getItem(draftStorageKey);
      if (!rawDraft) {
        resetDraftState();
        setHasHydrated(true);
        return;
      }

      const draft = JSON.parse(rawDraft);

      setTransactionDate(
        draft?.transactionDate || createDefaultDraft().transactionDate,
      );
      setSelectedSeries(draft?.selectedSeries || null);
      setParty(draft?.party || null);
      setCashBank(draft?.cashBank || null);
      setInstrumentType(draft?.instrumentType || "cash");
      setAmount(Number(draft?.amount) || 0);
      setBills(Array.isArray(draft?.bills) ? draft.bills : []);
      setSettlementDetails(
        Array.isArray(draft?.settlementDetails) ? draft.settlementDetails : [],
      );
      setNarration(draft?.narration || "");
      setChequeNumber(draft?.chequeNumber || "");
      setChequeDate(draft?.chequeDate ? new Date(draft.chequeDate) : null);
      setStep(draft?.step || "main");
    } catch (error) {
      console.error("Failed to hydrate cash transaction draft", error);
      resetDraftState();
    } finally {
      setHasHydrated(true);
    }
  }, [cmp_id, draftStorageKey, resetDraftState]);

  useEffect(() => {
    if (!cmp_id || !hasHydrated) return;

    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          transactionDate,
          selectedSeries,
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
        }),
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
    hasHydrated,
    instrumentType,
    narration,
    party,
    selectedSeries,
    settlementDetails,
    step,
    transactionDate,
  ]);

  return {
    transactionDate,
    setTransactionDate,
    selectedSeries,
    setSelectedSeries,
    party,
    setParty,
    cashBank,
    setCashBank,
    instrumentType,
    setInstrumentType,
    amount,
    setAmount,
    bills,
    setBills,
    settlementDetails,
    setSettlementDetails,
    narration,
    setNarration,
    chequeNumber,
    setChequeNumber,
    chequeDate,
    setChequeDate,
    step,
    setStep,
    clearDraft,
  };
}

export default useCashTransactionDraft;
