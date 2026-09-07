import { describe, expect, it } from "vitest";
import { calculateSaleTotals, normalizeSaleItemInput } from "../services/saleFoundation.service.js";

const ids = { product: "507f1f77bcf86cd799439011", godown: "507f1f77bcf86cd799439012", row: "507f1f77bcf86cd799439013" };
const normalized = normalizeSaleItemInput({ itemId: ids.product, id: "frontend-draft-id", godownId: ids.godown, godownStockRowId: ids.row, selectedUnit: "NOS", actualQty: 2, billedQty: 2, rate: 100, discountType: "percentage", discountValue: 10 });
const resolved = { ...normalized, tax_rates: { igst: 18, cgst: 9, sgst: 9, cess: 0, addl_cess: 0 } };

describe("Sale foundation calculations", () => {
  it("uses itemId, never frontend draft id, and validates numeric inputs", () => {
    expect(normalized.item_id).toBe(ids.product);
    expect(() => normalizeSaleItemInput({ ...normalized, itemId: ids.product, actualQty: Infinity })).toThrow("actualQty");
    expect(() => normalizeSaleItemInput({ ...normalized, itemId: ids.product, discountValue: 101 })).toThrow("discountValue");
    expect(() => normalizeSaleItemInput({ ...normalized, itemId: ids.product, taxInclusive: "false" })).toThrow("taxInclusive");
  });

  it("calculates item and signed master charge amounts authoritatively", () => {
    const result = calculateSaleTotals([resolved], [{ action: "subtract", value: 20, rates: { igst: 18, cgst: 9, sgst: 9 } }]);
    expect(result.items[0]).toMatchObject({ base_price: 200, discount_amount: 20, taxable_amount: 180, igst_amount: 32.4, total_amount: 212.4 });
    expect(result.additional_charges[0]).toMatchObject({ tax_amount: -3.6, final_value: -23.6, cess_amount: 0 });
    expect(result.totals.final_amount).toBe(188.8);
  });

  it("rejects a negative final amount instead of clamping it", () => {
    expect(() => calculateSaleTotals([resolved], [{ action: "subtract", value: 1000, rates: { igst: 0, cgst: 0, sgst: 0 } }])).toThrow("cannot be negative");
  });
});
