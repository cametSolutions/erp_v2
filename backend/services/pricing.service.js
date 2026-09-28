import mongoose from "mongoose";

import Sale from "../Model/Sale.js";
import SaleOrder from "../Model/SaleOrder.js";
import {
  getAccessibleCompanyIds,
  isStaffUser,
  resolveCurrentUserId,
} from "../utils/authScope.js";

function toObjectId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

function isNewerCandidate(candidate, current) {
  if (!current) return true;

  const candidateId = toObjectId(candidate?._id);
  const currentId = toObjectId(current?._id);
  // This preserves the legacy Sale Order rule: "last" means the most recently
  // created eligible transaction, not the highest rate or a master price.
  // ObjectId ordering retains the intra-second sequence that `getTimestamp()`
  // would lose when a Sale and Sale Order are created in the same second.
  return String(candidateId || "") > String(currentId || "");
}

async function getLatestPrice({ req, partyId, productId }) {
  const productObjectId = toObjectId(productId);
  const partyObjectId = partyId ? toObjectId(partyId) : null;
  const currentUserId = resolveCurrentUserId(req);
  const currentUserObjectId = toObjectId(currentUserId);

  if (!productObjectId || (partyId && !partyObjectId)) {
    return null;
  }

  const accessibleCompanyIds = await getAccessibleCompanyIds(req);
  if (!accessibleCompanyIds.length) {
    return null;
  }

  const saleOrderMatchStage = {
    $and: [
      {
        cmp_id: { $in: accessibleCompanyIds },
      },
      // Open and converted Sale Orders remain part of the established LSP/GSP
      // history. Cancelled orders must never supply a selling price.
      {
        status: { $ne: "cancelled" },
      },
      {
        $or: [
          { "items._id": productObjectId },
          { "items.item_id": productObjectId },
        ],
      },
    ],
  };

  if (isStaffUser(req)) {
    if (!currentUserObjectId) {
      return null;
    }

    saleOrderMatchStage.$and.push({
      created_by: currentUserObjectId,
    });
  }

  if (partyObjectId) {
    saleOrderMatchStage.$and.push({
      $or: [{ "party._id": partyObjectId }, { party_id: partyObjectId }],
    });
  }

  const saleMatchStage = {
    $and: [
      { cmp_id: { $in: accessibleCompanyIds } },
      // A Sale becomes eligible as soon as it is active. Pending Tally export
      // is still a completed Sale transaction; cancelled Sales are excluded.
      { status: "active" },
      {
        $or: [
          { "items._id": productObjectId },
          { "items.item_id": productObjectId },
        ],
      },
    ],
  };

  if (isStaffUser(req)) {
    saleMatchStage.$and.push({ created_by: currentUserObjectId });
  }
  if (partyObjectId) {
    saleMatchStage.$and.push({ party_id: partyObjectId });
  }

  const [saleOrderRecords, saleRecords] = await Promise.all([
    SaleOrder.aggregate([
      { $match: saleOrderMatchStage },
      { $sort: { _id: -1 } },
      { $unwind: "$items" },
      {
        $match: {
          $or: [
            { "items._id": productObjectId },
            { "items.item_id": productObjectId },
          ],
        },
      },
      {
        $project: {
          partyId: { $ifNull: ["$party._id", "$party_id"] },
          productId: { $ifNull: ["$items._id", "$items.item_id"] },
          transactionDate: { $ifNull: ["$transactionDate", "$date"] },
          price: {
            $ifNull: [
              "$items.rate",
              {
                $ifNull: [
                  { $arrayElemAt: ["$items.GodownList.selectedPriceRate", 0] },
                  "$items.purchase_price",
                ],
              },
            ],
          },
        },
      },
      { $match: { price: { $ne: null } } },
      { $limit: 1 },
    ]),
    Sale.aggregate([
      { $match: saleMatchStage },
      { $sort: { _id: -1 } },
      { $unwind: "$items" },
      {
        $match: {
          $or: [
            { "items._id": productObjectId },
            { "items.item_id": productObjectId },
          ],
        },
      },
      {
        $project: {
          partyId: "$party_id",
          productId: "$items.item_id",
          transactionDate: "$date",
          price: "$items.rate",
        },
      },
      { $match: { price: { $ne: null } } },
      { $limit: 1 },
    ]),
  ]);

  const candidates = [saleOrderRecords[0], saleRecords[0]].filter(Boolean);
  return candidates.reduce(
    (latest, candidate) =>
      isNewerCandidate(candidate, latest) ? candidate : latest,
    null,
  );
}

export async function getPartyLsp({ partyId, productId }, req) {
  const latest = await getLatestPrice({
    req,
    partyId,
    productId,
  });

  return {
    partyId,
    productId,
    price: latest?.price ?? null,
  };
}

export async function getGlobalLsp({ productId }, req) {
  const latest = await getLatestPrice({
    req,
    productId,
  });

  return {
    productId,
    price: latest?.price ?? null,
  };
}
