import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import * as saleOrderController from "../../controllers/saleOrderController.js";
import {
  getSeriesByVoucher,
  createVoucherSeries,
  updateVoucherSeries,
  deleteVoucherSeriesById,
  getNextVoucherSeriesNumber,
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
router.get("/saleOrders/:saleOrderId", protect, saleOrderController.getSaleOrderById);
router.put("/saleOrders/:id", protect, saleOrderController.updateSaleOrder);
router.put("/saleOrders/:id/cancel", protect, saleOrderController.cancelSaleOrder);
router.post("/createSaleOrder", protect, saleOrderController.createSaleOrder);
export default router;
