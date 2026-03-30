import VoucherSeries from "../Model/VoucherSeriesSchema.js";

function normalizeVoucherPart(value) {
  if (value == null) return "";
  return String(value).trim();
}

function formatVoucherNumber(prefix, number, suffix) {
  const normalizedPrefix = normalizeVoucherPart(prefix);
  const normalizedNumber = normalizeVoucherPart(number);
  const normalizedSuffix = normalizeVoucherPart(suffix);

  if (normalizedPrefix && normalizedNumber && normalizedSuffix) {
    return `${normalizedPrefix} / ${normalizedNumber} / ${normalizedSuffix}`;
  }

  if (normalizedPrefix && normalizedNumber) {
    return `${normalizedPrefix} / ${normalizedNumber}`;
  }

  if (normalizedNumber && normalizedSuffix) {
    return `${normalizedNumber} / ${normalizedSuffix}`;
  }

  return normalizedNumber || normalizedPrefix || normalizedSuffix;
}

export async function getNextVoucherNumber({
  cmpId,
  voucherType,
  seriesId,
  session,
}) {
  const filter = {
    cmp_id: cmpId,
    voucherType,
    "series._id": seriesId,
  };

  const seriesDocument = await VoucherSeries.findOne(filter).session(session);
  const existingSeries = seriesDocument?.series?.find(
    (series) => String(series?._id) === String(seriesId)
  );

  if (!existingSeries) {
    throw new Error("Series not found");
  }

  const updatedVoucherSeries = await VoucherSeries.findOneAndUpdate(
    filter,
    { $inc: { "series.$.currentNumber": 1 } },
    { new: true, session }
  );

  if (!updatedVoucherSeries) {
    throw new Error("Failed to update series");
  }

  const updatedSeries = updatedVoucherSeries.series?.find(
    (series) => String(series?._id) === String(seriesId)
  );

  if (!updatedSeries) {
    throw new Error("Series not found");
  }

  const paddedNumber = String(updatedSeries.currentNumber).padStart(
    updatedSeries.widthOfNumericalPart,
    "0"
  );
  const voucherNumber = formatVoucherNumber(
    updatedSeries.prefix,
    paddedNumber,
    updatedSeries.suffix
  );

  return {
    series: updatedSeries,
    nextNumber: updatedSeries.currentNumber,
    voucherNumber,
  };
}

export default getNextVoucherNumber;
