import express from "express";

import {
  getVouchers,
  getVoucherTotalsSummary,
} from "../../controllers/voucherController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getVoucherTotalsSummary);
router.get("/", protect, getVouchers);

export default router;
