import mongoose from "mongoose";

import Party from "../Model/partySchema.js";
import SaleOrder from "../Model/SaleOrder.js";
import { applyTransactionCreatorScope } from "../utils/authScope.js";
import {
  createVoucherTimelineEntry,
  updateVoucherTimelineEntry,
} from "./voucherTimeline.service.js";
import {
  assertTransactionEditable,
  assertTransactionNotAlreadyCancelled,
  markTransactionCancelled,
} from "./transactionState.service.js";
import { issueVoucherIdentity } from "./voucherIdentity.service.js";
import {
  buildVoucherTimelinePayload,
  buildVoucherTimelineUpdatePayload,
} from "./voucherTimelinePayload.service.js";
import {
  applySaleOrderUpdate,
  buildSaleOrderPayload,
  logSaleOrderTotalsMismatch,
  normalizeSelectedSeries,
} from "./saleOrderDocument.service.js";

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createSaleOrder(data = {}, req) {
  const session = await mongoose.startSession();

  try {
    let createdSaleOrder = null;
    const cmpId = data.cmpId || data.cmp_id;
    const selectedSeries = normalizeSelectedSeries(data);
    const userId = data.userId || data.created_by || req.user?._id || req.user?.id || null;
    const partyId = data.party?._id || data.party?.id || data.party_id || null;

    logSaleOrderTotalsMismatch(data);

    await session.withTransaction(async () => {
      const party = await Party.findOne({
        _id: partyId,
        cmp_id: cmpId,
      })
        .select("_id")
        .session(session)
        .lean();

      if (!party) {
        throw createHttpError("Selected party does not belong to this company", 400);
      }

      const voucherIdentity = await issueVoucherIdentity({
        cmpId,
        voucherType: "saleOrder",
        seriesId: selectedSeries?._id,
        userId,
        session,
      });

      const saleOrderDoc = buildSaleOrderPayload(
        { ...data, cmpId },
        voucherIdentity.voucher,
        voucherIdentity.serials,
        userId
      );

      const [created] = await SaleOrder.create([saleOrderDoc], { session });
      createdSaleOrder = await SaleOrder.findById(created._id).session(session).lean();

      await createVoucherTimelineEntry(buildVoucherTimelinePayload(created), session);
    });

    return createdSaleOrder;
  } finally {
    await session.endSession();
  }
}

export async function getSaleOrderById(id, { cmp_id } = {}, req) {
  const filter = applyTransactionCreatorScope(req, { _id: id });

  if (cmp_id) {
    filter.cmp_id = cmp_id;
  }

  return SaleOrder.findOne(filter).lean();
}

export async function updateSaleOrder(id, data = {}, req) {
  const session = await mongoose.startSession();

  try {
    const cmpId = data.cmpId || data.cmp_id;
    const userId = data.userId || data.updated_by || req.user?._id || req.user?.id || null;
    const partyId = data.party?._id || data.party?.id || data.party_id || null;
    let updatedSaleOrder = null;

    logSaleOrderTotalsMismatch(data);

    await session.withTransaction(async () => {
      if (partyId) {
        const party = await Party.findOne({
          _id: partyId,
          cmp_id: cmpId,
        })
          .select("_id")
          .session(session)
          .lean();

        if (!party) {
          throw createHttpError("Selected party does not belong to this company", 400);
        }
      }

      const saleOrder = await SaleOrder.findOne(
        applyTransactionCreatorScope(req, {
          _id: id,
          cmp_id: cmpId,
        })
      ).session(session);

      if (!saleOrder) {
        throw createHttpError("Sale order not found", 404);
      }

      assertTransactionEditable("saleOrder", saleOrder.status);

      applySaleOrderUpdate(saleOrder, data, userId);

      await saleOrder.save({ session });
      updatedSaleOrder = saleOrder.toObject();

      await updateVoucherTimelineEntry(
        {
          voucher_id: saleOrder._id,
          voucher_type: saleOrder.voucher_type,
        },
        buildVoucherTimelineUpdatePayload(saleOrder),
        session
      );
    });

    return updatedSaleOrder;
  } finally {
    await session.endSession();
  }
}

export async function cancelSaleOrder(id, data = {}, req) {
  const session = await mongoose.startSession();

  try {
    const cmpId = data.cmpId || data.cmp_id;
    const userId = data.userId || data.updated_by || req.user?._id || req.user?.id || null;
    let cancelledSaleOrder = null;

    await session.withTransaction(async () => {
      const saleOrder = await SaleOrder.findOne(
        applyTransactionCreatorScope(req, {
          _id: id,
          cmp_id: cmpId,
        })
      ).session(session);

      if (!saleOrder) {
        throw createHttpError("Sale order not found", 404);
      }

      assertTransactionNotAlreadyCancelled("saleOrder", saleOrder.status);

      markTransactionCancelled(saleOrder, "saleOrder");
      saleOrder.updated_by = userId || null;

      await saleOrder.save({ session });
      cancelledSaleOrder = saleOrder.toObject();

      await updateVoucherTimelineEntry(
        {
          voucher_id: saleOrder._id,
          voucher_type: saleOrder.voucher_type,
        },
        buildVoucherTimelineUpdatePayload(saleOrder, { status: saleOrder.status || null }),
        session
      );
    });

    return cancelledSaleOrder;
  } finally {
    await session.endSession();
  }
}
