import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import ErrorRetryState from "@/components/common/ErrorRetryState";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import SaleOrderDetailView from "@/components/transactions/details/SaleOrderDetailView";
import TransactionTypePlaceholder from "@/components/transactions/details/TransactionTypePlaceholder";
import { usePrintConfigQuery } from "@/hooks/queries/printConfigQueries";
import { useSaleOrderDetailQuery } from "@/hooks/queries/saleOrderQueries";

const ORDER_VOUCHER_TYPES = new Set([
  "sale",
  "purchase",
  "saleReturn",
  "purchaseReturn",
]);
const RECEIPT_PAYMENT_VOUCHER_TYPES = new Set(["receipt", "payment"]);

export default function TransactionDetailPage({
  forcedVoucherType = null,
  idParam = "voucherId",
}) {
  const params = useParams();
  const location = useLocation();
  const cmpId = useSelector((state) => state.company.selectedCompanyId);
  const selectedCompany = useSelector((state) => state.company.selectedCompany);
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();

  const fallbackTransaction =
    location.state?.transaction || location.state?.saleOrder || null;
  const voucherType =
    forcedVoucherType ||
    params.voucherType ||
    location.state?.voucherType ||
    fallbackTransaction?.voucher_type ||
    "saleOrder";
  const voucherId = params[idParam] || params.voucherId || params.saleOrderId || null;

  useEffect(() => {
    setHeaderOptions({ showMenuDots: false });
    return () => resetHeaderOptions();
  }, [resetHeaderOptions, setHeaderOptions]);

  const saleOrderQuery = useSaleOrderDetailQuery(voucherId, cmpId, {
    enabled: voucherType === "saleOrder" && Boolean(voucherId),
    initialData: voucherType === "saleOrder" ? fallbackTransaction : undefined,
  });
  const saleOrderPrintConfigQuery = usePrintConfigQuery(
    voucherType === "saleOrder" ? cmpId : null,
    "sale_order"
  );

  if (voucherType === "saleOrder") {
    const saleOrder = saleOrderQuery.data || fallbackTransaction;

    if (saleOrderQuery.isLoading && !saleOrder) {
      return (
        <div className="mx-auto w-full max-w-5xl space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
      );
    }

    if (saleOrderQuery.isError || !saleOrder) {
      return (
        <div className="mx-auto w-full max-w-xl p-4">
          <div className="rounded-2xl border border-slate-200 bg-white">
            <ErrorRetryState
              message={
                saleOrderQuery.error?.response?.data?.message ||
                saleOrderQuery.error?.message ||
                "Sale order details could not be loaded."
              }
              onRetry={() => saleOrderQuery.refetch()}
            />
          </div>
        </div>
      );
    }

    return (
      <SaleOrderDetailView
        saleOrder={saleOrder}
        org={selectedCompany}
        configurations={saleOrderPrintConfigQuery.data?.config || null}
        bankDetails={selectedCompany?.bankDetails || null}
      />
    );
  }

  if (ORDER_VOUCHER_TYPES.has(voucherType)) {
    return (
      <TransactionTypePlaceholder
        title="Voucher Detail Coming Soon"
        description="This shared detail layout is reserved for sale, purchase, and return vouchers. We can plug those transaction-specific sections in here as those flows are added."
      />
    );
  }

  if (RECEIPT_PAYMENT_VOUCHER_TYPES.has(voucherType)) {
    return (
      <TransactionTypePlaceholder
        title="Receipt / Payment Detail Coming Soon"
        description="Receipt and payment details will open in this shared transaction page once those transaction flows are completed."
      />
    );
  }

  return (
    <TransactionTypePlaceholder
      title="Transaction Detail Not Available"
      description="This voucher type does not have a detail renderer yet."
    />
  );
}
