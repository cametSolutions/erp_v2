export const CASH_BANK_VOUCHER_MODEL_BY_TYPE = Object.freeze({
  receipt: "Receipt",
  payment: "Payment",
  sale: "Sale",
});

// CashBankLedger writers derive this value from the trusted backend voucher
// type. Frontend input must never choose the Mongoose model relationship.
export function getCashBankVoucherModel(voucherType) {
  return CASH_BANK_VOUCHER_MODEL_BY_TYPE[String(voucherType || "").trim()] || null;
}

export default getCashBankVoucherModel;
