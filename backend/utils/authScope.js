import mongoose from "mongoose";
import Company from "../Model/CompanySchema.js";
import {
  isStaffUser,
  resolveAdminOwnerId,
  resolveCurrentUserId,
} from "./companyScope.js";

export function applyTransactionCreatorScope(req, filter = {}) {
  if (isStaffUser(req)) {
    const currentUserId = resolveCurrentUserId(req);
    if (!currentUserId) {
      return { ...filter, created_by: null };
    }

    const normalizedCreatedBy = mongoose.Types.ObjectId.isValid(currentUserId)
      ? new mongoose.Types.ObjectId(currentUserId)
      : currentUserId;

    return {
      ...filter,
      created_by: normalizedCreatedBy,
    };
  }

  return filter;
}

export async function getAccessibleCompanyIds(req) {
  const adminOwnerId = resolveAdminOwnerId(req);
  if (!adminOwnerId) return [];

  return Company.find({ owner: adminOwnerId }).distinct("_id");
}

export { isStaffUser, resolveAdminOwnerId, resolveCurrentUserId };
