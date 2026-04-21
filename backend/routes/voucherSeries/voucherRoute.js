import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";
import {
  getSeriesByVoucher,
  createVoucherSeries,
  updateVoucherSeries,
  deleteVoucherSeriesById,
  getNextVoucherSeriesNumber,
} from "../../controllers/voucherSerieController.js";

const router = express.Router();

router.get("/:cmp_id", protect, requireCompanyAccess, getSeriesByVoucher);
router.post("/:cmp_id", protect, requireCompanyAccess, createVoucherSeries);
router.put("/:cmp_id/:seriesId", protect, requireCompanyAccess, updateVoucherSeries);
router.delete("/:cmp_id/:seriesId", protect, requireCompanyAccess, deleteVoucherSeriesById);
router.get(
  "/:cmp_id/next-number",
  protect,
  requireCompanyAccess,
  getNextVoucherSeriesNumber,
);

export default router;
