import getNextTransactionSerialNumbers from "../utils/getNextTransactionSerialNumbers.js";
import getNextVoucherNumber from "../utils/getNextVoucherNumber.js";

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function issueVoucherIdentity({
  cmpId,
  voucherType,
  transactionType,
  seriesId,
  userId,
  session,
}) {
  if (!cmpId) {
    throw createHttpError("Company id is required for voucher identity", 400);
  }

  if (!voucherType) {
    throw createHttpError("Voucher type is required for voucher identity", 400);
  }

  if (!seriesId) {
    throw createHttpError("Series id is required for voucher identity", 400);
  }

  if (!userId) {
    throw createHttpError("User id is required for voucher identity", 400);
  }

  const resolvedTransactionType = transactionType || voucherType;

  const [voucher, serials] = await Promise.all([
    getNextVoucherNumber({
      cmpId,
      voucherType,
      seriesId,
      session,
    }),
    getNextTransactionSerialNumbers({
      cmpId,
      transactionType: resolvedTransactionType,
      userId,
      session,
    }),
  ]);

  return {
    voucher,
    serials,
    voucherNumber: voucher.voucherNumber,
    currentSeriesNumber: voucher.nextNumber,
    nextAvailableSeriesNumber: voucher.nextAvailableNumber,
    series: voucher.series,
    companyLevelSerialNumber: serials.companyLevelSerialNumber,
    userLevelSerialNumber: serials.userLevelSerialNumber,
  };
}

export default issueVoucherIdentity;
