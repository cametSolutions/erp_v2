export function calculateAutoSettlement(amount, bills = []) {
  let remaining = Number(amount) || 0;

  return bills.map((bill) => {
    const pendingAmount = Number(bill?.bill_pending_amt) || 0;
    const nextBill = {
      ...bill,
      checked: false,
      settled_amount: 0,
    };

    if (remaining <= 0) {
      return nextBill;
    }

    if (remaining >= pendingAmount) {
      nextBill.checked = true;
      nextBill.settled_amount = pendingAmount;
      remaining -= pendingAmount;
      return nextBill;
    }

    nextBill.checked = true;
    nextBill.settled_amount = remaining;
    remaining = 0;
    return nextBill;
  });
}

export default calculateAutoSettlement;
