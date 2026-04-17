import express from "express";

import {
  getVouchers,
  getVoucherTotalsSummary,
} from "../../controllers/voucherController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";

const router = express.Router();

router.get("/summary", protect, requireCompanyAccess, getVoucherTotalsSummary);
router.get("/", protect, requireCompanyAccess, getVouchers);

export default router;
