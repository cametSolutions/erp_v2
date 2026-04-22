import TransactionDetailPage from "@/pages/transactions/TransactionDetailPage";

// Thin adapter page:
// forces generic TransactionDetailPage to behave as sale-order detail route.
export default function SaleOrderDetailPage() {
  return <TransactionDetailPage forcedVoucherType="saleOrder" idParam="saleOrderId" />;
}
