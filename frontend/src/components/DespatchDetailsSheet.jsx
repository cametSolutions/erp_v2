import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setDespatchDetails,
} from "@/store/slices/transactionSlice";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Despatch details editor (bottom sheet).
 *
 * Uses local form state while open, and only commits to Redux on Save.
 *
 * @param {{open: boolean, onOpenChange: (open: boolean) => void}} props
 * @returns {JSX.Element}
 */
export default function DespatchDetailsSheet({ open, onOpenChange }) {
  const dispatch = useDispatch();
  const existing = useSelector((state) => state.transaction.despatchDetails);
  const [form, setForm] = useState(existing);

  /**
   * Updates a single field in local form draft.
   *
   * @param {string} field
   * @param {string} value
   * @returns {void}
   */
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Sheet visibility handler.
   * Rehydrates form from Redux whenever opening.
   *
   * @param {boolean} nextOpen
   * @returns {void}
   */
  const handleSheetChange = (nextOpen) => {
    if (nextOpen) {
      setForm(existing);
    }

    onOpenChange(nextOpen);
  };

  /**
   * Commits local despatch draft into transaction slice.
   *
   * @returns {void}
   */
  const handleSave = () => {
    dispatch(setDespatchDetails(form));
    handleSheetChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetChange}>
      <SheetContent
        side="bottom"
        className="max-h-[82vh] overflow-y-auto rounded-t-3xl"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle className="text-sm">Despatch Details</SheetTitle>
          <SheetDescription className="text-xs">
            Enter challan, transport, and destination information for this order.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 text-xs md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">
              Challan No
            </label>
            <Input
              className="h-8 text-xs"
              value={form?.challanNo || ""}
              onChange={(e) => handleChange("challanNo", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">
              Container No
            </label>
            <Input
              className="h-8 text-xs"
              value={form?.containerNo || ""}
              onChange={(e) => handleChange("containerNo", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">
              Despatch Through
            </label>
            <Input
              className="h-8 text-xs"
              value={form?.despatchThrough || ""}
              onChange={(e) => handleChange("despatchThrough", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">
              Destination
            </label>
            <Input
              className="h-8 text-xs"
              value={form?.destination || ""}
              onChange={(e) => handleChange("destination", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">
              Vehicle No
            </label>
            <Input
              className="h-8 text-xs"
              value={form?.vehicleNo || ""}
              onChange={(e) => handleChange("vehicleNo", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">
              Order No
            </label>
            <Input
              className="h-8 text-xs"
              value={form?.orderNo || ""}
              onChange={(e) => handleChange("orderNo", e.target.value)}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-medium text-slate-500">
              Terms of Payment
            </label>
            <Input
              className="h-8 text-xs"
              value={form?.termsOfPay || ""}
              onChange={(e) => handleChange("termsOfPay", e.target.value)}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-medium text-slate-500">
              Terms of Delivery
            </label>
            <Input
              className="h-8 text-xs"
              value={form?.termsOfDelivery || ""}
              onChange={(e) => handleChange("termsOfDelivery", e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            size="lg"
            type="button"
            onClick={() => handleSheetChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            type="button"
            onClick={handleSave}
            className="bg-emerald-600 px-4 text-white hover:bg-emerald-700"
          >
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
