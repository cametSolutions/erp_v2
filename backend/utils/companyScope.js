import mongoose from "mongoose";

import Company from "../Model/CompanySchema.js";

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function resolveCurrentUserId(req) {
  return req?.user?.id || null;
}

export function isStaffUser(req) {
  return req?.user?.role === "staff";
}

export function resolveAdminOwnerId(req) {
  return req?.user?.owner || req?.user?.id || null;
}

export function resolveEffectiveOwnerId(req) {
  if (req?.user?.role === "admin") {
    return req.user.id || null;
  }

  if (req?.user?.role === "staff") {
    return req.user.owner || null;
  }

  return null;
}

export function getRequestedCompanyId(req) {
  return (
    req?.companyId ||
    req?.params?.cmp_id ||
    req?.params?.cmpId ||
    req?.body?.cmp_id ||
    req?.body?.cmpId ||
    req?.query?.cmp_id ||
    req?.query?.cmpId ||
    req?.headers?.["x-company-id"] ||
    null
  );
}

export function resolveCompanyScope(req, options = {}) {
  const { requireCompanyId = false, validateCompanyId = false } = options;
  const cmp_id = getRequestedCompanyId(req);
  const Primary_user_id = resolveAdminOwnerId(req);

  if (requireCompanyId && !cmp_id) {
    throw createHttpError("cmp_id is required", 400);
  }

  if (validateCompanyId && cmp_id && !mongoose.Types.ObjectId.isValid(cmp_id)) {
    throw createHttpError("Invalid cmp_id", 400);
  }

  return {
    cmp_id: cmp_id || null,
    Primary_user_id,
    current_user_id: resolveCurrentUserId(req),
    is_staff_user: isStaffUser(req),
  };
}

export async function requireResolvedCompanyAccess(req) {
  const requestedCompanyId = getRequestedCompanyId(req);

  if (!requestedCompanyId) {
    throw createHttpError("cmp_id is required", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(requestedCompanyId)) {
    throw createHttpError("Invalid cmp_id", 400);
  }

  const ownerId = resolveEffectiveOwnerId(req);
  if (!ownerId) {
    throw createHttpError("Unauthorized", 401);
  }

  const company = await Company.findOne({
    _id: requestedCompanyId,
    owner: ownerId,
  })
    .select("_id owner")
    .lean();

  if (!company) {
    throw createHttpError("Access denied for this company", 403);
  }

  return {
    companyId: String(company._id),
    ownerId,
    company,
  };
}

export default {
  getRequestedCompanyId,
  isStaffUser,
  requireResolvedCompanyAccess,
  resolveAdminOwnerId,
  resolveCompanyScope,
  resolveCurrentUserId,
  resolveEffectiveOwnerId,
};
