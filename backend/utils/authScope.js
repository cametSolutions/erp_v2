import Company from "../Model/CompanySchema.js";

export function resolveAdminOwnerId(req) {
  return req?.user?.owner || req?.user?.id || null;
}

export function resolveCurrentUserId(req) {
  return req?.user?.id || null;
}

export function isStaffUser(req) {
  return req?.user?.role === "staff";
}

export function applyTransactionCreatorScope(req, filter = {}) {
  if (isStaffUser(req)) {
    const currentUserId = resolveCurrentUserId(req);
    if (!currentUserId) {
      return { ...filter, created_by: null };
    }

    return {
      ...filter,
      created_by: currentUserId,
    };
  }

  return filter;
}

export async function getAccessibleCompanyIds(req) {
  const adminOwnerId = resolveAdminOwnerId(req);
  if (!adminOwnerId) return [];

  return Company.find({ owner: adminOwnerId }).distinct("_id");
}
