import CashTransactionScreen from "@/pages/cashTransaction/CashTransactionScreen";

// Thin wrapper route for receipt creation flow.
export default function CreateReceiptPage() {
  return <CashTransactionScreen voucher_type="receipt" />;
}
