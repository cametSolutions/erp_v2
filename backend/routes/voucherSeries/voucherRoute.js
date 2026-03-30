import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import {
  getSeriesByVoucher,
  createVoucherSeries,
  updateVoucherSeries,
  deleteVoucherSeriesById,
  getNextVoucherSeriesNumber,
  createSaleOrder,
  getSaleOrderById,
} from "../../controllers/voucherSerieController.js";

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

router.get(
  "/nextVoucherSeriesNumber/:cmp_id",
  protect,
  getNextVoucherSeriesNumber
);
router.get("/saleOrders/:saleOrderId", protect, getSaleOrderById);
router.post("/createSaleOrder", protect, createSaleOrder);
export default router;
