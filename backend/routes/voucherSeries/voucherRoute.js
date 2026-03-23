import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { getSeriesByVoucher,createVoucherSeries,updateVoucherSeries,deleteVoucherSeriesById } from "../../controllers/voucherSerieController.js";

const router = express.Router();

router.get("/getSeriesByVoucher/:cmp_id", protect,getSeriesByVoucher);
router.post("/createVoucherSeries/:cmp_id", protect, createVoucherSeries);
router.put(
  "/updateVoucherSeries/:cmp_id/:seriesId",
  protect,
  updateVoucherSeries
);
router.delete(
  "/deleteVoucherSeriesById/:cmp_id",
  protect,
  deleteVoucherSeriesById
);
export default router;