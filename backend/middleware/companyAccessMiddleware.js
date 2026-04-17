import mongoose from "mongoose";

import Company from "../Model/CompanySchema.js";

function getRequestedCompanyId(req) {
  return (
    req.params?.cmp_id ||
    req.params?.cmpId ||
    req.body?.cmp_id ||
    req.body?.cmpId ||
    req.query?.cmp_id ||
    req.query?.cmpId ||
    req.headers["x-company-id"] ||
    null
  );
}

function getEffectiveOwnerId(req) {
  if (req.user?.role === "admin") {
    return req.user.id || null;
  }

  if (req.user?.role === "staff") {
    return req.user.owner || null;
  }

  return null;
}

export const requireCompanyAccess = async (req, res, next) => {
  try {
    const requestedCompanyId = getRequestedCompanyId(req);

    if (!requestedCompanyId) {
      return res.status(400).json({ message: "cmp_id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(requestedCompanyId)) {
      return res.status(400).json({ message: "Invalid cmp_id" });
    }

    const ownerId = getEffectiveOwnerId(req);
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const company = await Company.findOne({
      _id: requestedCompanyId,
      owner: ownerId,
    })
      .select("_id owner")
      .lean();

    if (!company) {
      return res
        .status(403)
        .json({ message: "Access denied for this company" });
    }

    req.companyId = String(company._id);
    next();
  } catch (error) {
    console.error("requireCompanyAccess error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default {
  requireCompanyAccess,
};
