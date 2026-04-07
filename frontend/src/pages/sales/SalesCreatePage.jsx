import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { saleOrderService } from "@/api/services/saleOrder.service";
import AdditionalChargesSection from "@/components/sales/create/AdditionalChargesSection";
import DetailsSection from "@/components/sales/create/DetailsSection";
import ItemsSection from "@/components/sales/create/ItemsSection";
import PartySection from "@/components/sales/create/PartySection";
import SummarySection from "@/components/sales/create/SummarySection";
import { useCreateSaleOrder } from "@/hooks/mutations/useCreateSaleOrder";
import TransactionHeader from "@/components/TransactionHeader";
import { ROUTES } from "@/routes/paths";
import { resetSaleOrderDraft, setCompany } from "@/store/slices/transactionSlice";


export default function SalesCreatePage() {
  const cmp_id = useSelector((state) => state.company.selectedCompanyId);
  const party = useSelector((state) => state.transaction.party);
  const items = useSelector((state) => state.transaction.items);
  const despatchDetails = useSelector((state) => state.transaction.despatchDetails);
  const additionalCharges = useSelector((state) => state.transaction.additionalCharges);
  const totals = useSelector((state) => state.transaction.totals);
  const selectedPriceLevel = useSelector((state) => state.transaction.priceLevelObject);
  const taxType = useSelector((state) => state.transaction.taxType);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [buildHeaderPayload, setBuildHeaderPayload] = useState(null);


  // console.log(buildHeaderPayload());
  

  useEffect(() => {
    if (!cmp_id) return;

    dispatch(setCompany({ cmp_id }));
  }, [cmp_id, dispatch]);

  const createSaleOrderMutation = useCreateSaleOrder({
    cmp_id,
    onSuccess: (data) => {
      const saleOrder = data?.data?.saleOrder;
      if (saleOrder?._id) {
        dispatch(resetSaleOrderDraft());
        navigate(
          ROUTES.transactionDetail
            .replace(":voucherType", "saleOrder")
            .replace(":voucherId", saleOrder._id),
          {
            state: { transaction: saleOrder },
          },
        );
      }
    },
  });

  const handleCreateSaleOrder = () => {
    const headerPayload = buildHeaderPayload ? buildHeaderPayload() : {};
    const payload = saleOrderService.buildCreateSaleOrderPayload({
      cmp_id,
      taxType,
      party,
      items,
      despatchDetails,
      additionalCharges,
      totals,
      selectedPriceLevel,
      headerPayload,
    });

    createSaleOrderMutation.mutate(payload);
  };

  const createLoading =
    createSaleOrderMutation.isPending || createSaleOrderMutation.isLoading;
  const headerReady = Boolean(buildHeaderPayload);
  const hasParty = Boolean(party?._id || party?.id);
  const hasItems = items.length > 0;
  const disableCreate = !cmp_id || !headerReady || !hasParty || !hasItems;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <TransactionHeader
        cmp_id={cmp_id}
        title="Order"
        numberField="salesOrderNumber"
        onHeaderReady={setBuildHeaderPayload}
      />

      <main className="flex-1 overflow-y-auto px-1 py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <PartySection />
          <DetailsSection />
          <ItemsSection />
          <AdditionalChargesSection />
          <SummarySection
            onCreate={handleCreateSaleOrder}
            createLoading={createLoading}
            createError={createSaleOrderMutation.error}
            disableCreate={disableCreate}
          />
        </div>
      </main>
    </div>
  );
}
