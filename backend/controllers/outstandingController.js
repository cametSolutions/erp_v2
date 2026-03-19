// controllers/outstandingController.js
import Outstanding from "../Model/oustandingShcema.js";
import mongoose from "mongoose";

export const getOutstandingByParty = async (req, res) => {
  try {
    const owner = req.user.id;
    const { partyId } = req.params;
    const { cmp_id } = req.query;

    if (!cmp_id) {
      return res
        .status(400)
        .json({ message: "cmp_id (company) is required" });
    }

    const cmpObjectId = new mongoose.Types.ObjectId(cmp_id);
    const partyObjectId = new mongoose.Types.ObjectId(partyId);

    const bills = await Outstanding.find({
      Primary_user_id: owner,
      cmp_id: cmpObjectId,
      party_id: partyObjectId,
      isCancelled: false,
    })
      .sort({ bill_date: 1 })
      .lean();

    res.json({ items: bills });
  } catch (err) {
    console.error("getOutstandingByParty error:", err);
    res.status(500).json({ message: "Failed to fetch outstanding bills" });
  }
};
