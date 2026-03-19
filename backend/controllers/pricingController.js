import mongoose from "mongoose";

import SaleOrder from "../Model/saleOrderSchema.js";

function toObjectId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

async function getLatestPrice({ owner, partyId, productId }) {
  const productObjectId = toObjectId(productId);
  const partyObjectId = partyId ? toObjectId(partyId) : null;

  if (!productObjectId || (partyId && !partyObjectId)) {
    return null;
  }

  const matchStage = {
    Primary_user_id: new mongoose.Types.ObjectId(owner),
    "items._id": productObjectId,
  };

  if (partyObjectId) {
    matchStage["party._id"] = partyObjectId;
  }

  const records = await SaleOrder.aggregate([
    { $match: matchStage },
    { $sort: { _id: -1 } },
    { $unwind: "$items" },
    { $match: { "items._id": productObjectId } },
    {
      $project: {
        partyId: "$party._id",
        productId: "$items._id",
        transactionDate: "$transactionDate",
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
      owner: req.user.id,
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
      owner: req.user.id,
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
