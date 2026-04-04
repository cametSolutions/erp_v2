import mongoose from "mongoose";

import SaleOrder from "../Model/SaleOrder.js";

function toObjectId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

async function getLatestPrice({ owner, partyId, productId }) {
  const productObjectId = toObjectId(productId);
  const partyObjectId = partyId ? toObjectId(partyId) : null;
  const ownerObjectId = toObjectId(owner);

  if (!productObjectId || (partyId && !partyObjectId) || !ownerObjectId) {
    return null;
  }

  const matchStage = {
    $and: [
      {
        $or: [
          { Primary_user_id: ownerObjectId },
          { created_by: ownerObjectId },
        ],
      },
      {
        $or: [
          { "items._id": productObjectId },
          { "items.item_id": productObjectId },
        ],
      },
    ],
  };

  if (partyObjectId) {
    matchStage.$and.push({
      $or: [{ "party._id": partyObjectId }, { party_id: partyObjectId }],
    });
  }

  const records = await SaleOrder.aggregate([
    { $match: matchStage },
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
  ]);

  return records[0] || null;
}

export const getPartyLsp = async (req, res) => {
  try {
    const { partyId, productId } = req.query;

    if (!partyId || !productId) {
      return res
        .status(400)
        .json({ message: "partyId and productId are required" });
    }

    const latest = await getLatestPrice({
      owner: req.user.owner || req.user.id,
      partyId,
      productId,
    });

    return res.json({
      partyId,
      productId,
      price: latest?.price ?? null,
    });
  } catch (error) {
    console.error("getPartyLsp error:", error);
    return res.status(500).json({ message: "Failed to fetch party LSP" });
  }
};

export const getGlobalLsp = async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const latest = await getLatestPrice({
      owner: req.user.owner || req.user.id,
      productId,
    });

    return res.json({
      productId,
      price: latest?.price ?? null,
    });
  } catch (error) {
    console.error("getGlobalLsp error:", error);
    return res.status(500).json({ message: "Failed to fetch global LSP" });
  }
};
