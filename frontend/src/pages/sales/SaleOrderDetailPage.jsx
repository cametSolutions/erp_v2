import TransactionDetailPage from "@/pages/transactions/TransactionDetailPage";

export default function SaleOrderDetailPage() {
  return <TransactionDetailPage forcedVoucherType="saleOrder" idParam="saleOrderId" />;
}
