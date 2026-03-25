export function buildItemForCalculation(stagedItem) {
  return {
    billedQty: Number(stagedItem?.billedQty ?? stagedItem?.quantity) || 0,
    rate: Number(stagedItem?.rate) || 0,
    taxRate:
      Number(stagedItem?.productDetail?.taxRate ?? stagedItem?.taxRate) || 0,
    taxInclusive: Boolean(stagedItem?.taxInclusive),
    discountAmount: Number(stagedItem?.discountAmount) || 0,
    discountPercentage: Number(stagedItem?.discountPercentage) || 0,
  };
}
