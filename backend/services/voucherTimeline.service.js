import VoucherTimeline from "../Model/VoucherTimeline.js";

export async function createVoucherTimelineEntry(payload = {}, session) {
  const [entry] = await VoucherTimeline.create([payload], { session });
  return entry;
}

export async function updateVoucherTimelineEntry(
  { voucher_id, voucher_type },
  payload = {},
  session
) {
  return VoucherTimeline.findOneAndUpdate(
    {
      voucher_id,
      voucher_type,
    },
    {
      $set: payload,
    },
    {
      returnDocument: "after",
      session,
      runValidators: true,
    }
  );
}

export default {
  createVoucherTimelineEntry,
  updateVoucherTimelineEntry,
};
