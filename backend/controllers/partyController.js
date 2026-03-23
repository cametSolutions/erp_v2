// controllers/partyController.js
import mongoose from "mongoose";
import Party from "../Model/partySchema.js"
import AccountGroup from "../Model/AccountGroup.js";
import Outstanding from "../Model/oustandingShcema.js";

const resolveAccountGroupId = async ({ cmp_id, accountGroup }) => {
  if (accountGroup && accountGroup !== "") {
    return accountGroup;
  }

  const fallbackGroup = await AccountGroup.findOne({
    accountGroup: "Sundry Debtors",
    cmp_id,
  });

  if (!fallbackGroup) {
    return null;
  }

  return fallbackGroup._id;
};

export const addParty = async (req, res) => {
  try {
    let {
      cmp_id,
      accountGroup,
      subGroup,
      partyName,
      mobileNumber,
      emailID,
      gstNo,
      panNo,
      billingAddress,
      shippingAddress,
      creditPeriod,
      creditLimit,
      openingBalanceType,
      openingBalanceAmount,
      country,
      state,
      pin,
      party_master_id,
      partyType, // optional, default 'party'
    } = req.body;

    // use currently selected company (if you store it) or from body:
    // cmp_id = cmp_id || req.companyIdFromHeader;

    accountGroup = await resolveAccountGroupId({ cmp_id, accountGroup });
    if (!accountGroup) {
      return res
        .status(400)
        .json({ success: false, message: "Default account group not found" });
    }

    const generatedId = new mongoose.Types.ObjectId();
    const cleanSubGroup = subGroup === "" ? undefined : subGroup;

    const party = new Party({
      _id: generatedId,
      cmp_id,
      Primary_user_id: req.user.id,
      partyType: partyType || "party",
      accountGroup,
      subGroup: cleanSubGroup,
      partyName,
      mobileNumber,
      emailID,
      gstNo,
      panNo,
      billingAddress,
      shippingAddress,
      creditPeriod,
      creditLimit,
      openingBalanceType,
      openingBalanceAmount,
      country,
      state,
      pin,
      party_master_id: party_master_id || generatedId.toString(),
    });

    const result = await party.save();

    return res.status(201).json({
      success: true,
      message: "Party added successfully",
      party: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error, try again!" });
  }
};

export const listParties = async (req, res) => {
  try {
    const owner = req.user.id; // logged-in primary user
    const {
      cmp_id,
      page = 1,
      limit = 20,
      search = "",
      ledgerType = "all", // all | receivable | payable
    } = req.query;

    if (!cmp_id) {
      return res
        .status(400)
        .json({ message: "cmp_id (company) is required" });
    }

    const cmpObjectId = new mongoose.Types.ObjectId(cmp_id);

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      Primary_user_id: owner,
      cmp_id: cmpObjectId,
    };

    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch) {
      const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(safeSearch, "i");

      filter.$or = [
        { partyName: searchRegex },
        { mobileNumber: searchRegex },
        { emailID: searchRegex },
        { gstNo: searchRegex },
      ];
    }

    // 1) Fetch paginated parties
    const [parties, total] = await Promise.all([
      Party.find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Party.countDocuments(filter),
    ]);

    const hasMore = skip + parties.length < total;

    if (parties.length === 0) {
      return res.json({
        items: [],
        total: 0,
        page: pageNum,
        hasMore: false,
      });
    }

    // 2) Prepare ObjectId list for aggregation
    const partyIds = parties.map((p) => p._id);

    // 3) Aggregate dr/cr from Outstanding
    const totals = await Outstanding.aggregate([
      {
        $match: {
          Primary_user_id: new mongoose.Types.ObjectId(owner),
          cmp_id: cmpObjectId,
          party_id: { $in: partyIds },
          isCancelled: false,
        },
      },
      {
        $group: {
          _id: "$party_id",
          totalDr: {
            $sum: {
              $cond: [
                { $eq: ["$classification", "dr"] },
                "$bill_pending_amt",
                0,
              ],
            },
          },
          totalCr: {
            $sum: {
              $cond: [
                { $eq: ["$classification", "cr"] },
                "$bill_pending_amt",
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalsMap = totals.reduce((acc, t) => {
      const key = String(t._id);
      acc[key] = {
        totalDr: t.totalDr || 0,
        totalCr: t.totalCr || 0,
      };
      return acc;
    }, {});

    // 4) Attach totals and classification
    let items = parties.map((p) => {
      const key = String(p._id);
      const t = totalsMap[key] || { totalDr: 0, totalCr: 0 };
      const balance = t.totalDr - t.totalCr; // dr - cr

      return {
        ...p,
        totalOutstanding: balance,
        classification: balance >= 0 ? "dr" : "cr",
      };
    });

    // 5) Apply ledgerType filter (on per-party balance)
    if (ledgerType === "receivable") {
      // receivables: dr balance > 0
      items = items.filter((p) => p.totalOutstanding > 0);
    } else if (ledgerType === "payable") {
      // payables: cr balance < 0
      items = items.filter((p) => p.totalOutstanding < 0);
    }

    // You can recompute total/hasMore based on filtered items or leave as original.
    return res.json({
      items,
      total: items.length,
      page: pageNum,
      hasMore,
    });
  } catch (err) {
    console.error("listParties error:", err);
    return res.status(500).json({ message: "Failed to fetch parties" });
  }
};

export const getPartyById = async (req, res) => {
  try {
    const owner = req.user.id;
    const { id } = req.params;
    const party = await Party.findOne({ _id: id, Primary_user_id: owner });
    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }
    res.json(party);
  } catch {
    res.status(500).json({ message: "Failed to fetch party" });
  }
};

export const updateParty = async (req, res) => {
  try {
    const owner = req.user.id;
    const { id } = req.params;
    const existingParty = await Party.findOne({ _id: id, Primary_user_id: owner });

    if (!existingParty) {
      return res.status(404).json({ message: "Party not found" });
    }

    const accountGroup = await resolveAccountGroupId({
      cmp_id: req.body?.cmp_id || existingParty.cmp_id,
      accountGroup: req.body?.accountGroup,
    });

    if (!accountGroup) {
      return res.status(400).json({ message: "Default account group not found" });
    }

    const updatePayload = {
      ...req.body,
      accountGroup,
      subGroup:
        req.body?.subGroup === "" || req.body?.subGroup == null
          ? null
          : req.body.subGroup,
    };

    const party = await Party.findOneAndUpdate(
      { _id: id, Primary_user_id: owner },
      updatePayload,
      { new: true, runValidators: true }
    );

    res.json({ message: "Party updated", party });
  } catch {
    res.status(500).json({ message: "Failed to update party" });
  }
};

export const deleteParty = async (req, res) => {
  try {
    const owner = req.user.id;
    const { id } = req.params;

    const party = await Party.findOneAndDelete({
      _id: id,
      Primary_user_id: owner,
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    res.json({ message: "Party deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete party" });
  }
};


export const getParties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      cmp_id,
      Primary_user_id,
      partyType,
    } = req.query;

    const query = {};
    if (cmp_id) query.cmp_id = cmp_id;
    if (Primary_user_id) query.Primary_user_id = Primary_user_id;
    if (partyType) query.partyType = partyType; // critical

    console.log("getParties query =", query);

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Party.find(query).skip(skip).limit(Number(limit)),
      Party.countDocuments(query),
    ]);

    return res.status(200).json({
      items,
      total,
      page: Number(page),
      hasMore: skip + items.length < total,
    });
  } catch (err) {
    console.error("getParties error", err);
    return res.status(500).json({ message: "Server error" });
  }
};