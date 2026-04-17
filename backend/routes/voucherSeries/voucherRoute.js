import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";
import * as saleOrderController from "../../controllers/saleOrderController.js";
import {
  getSeriesByVoucher,
  createVoucherSeries,
  updateVoucherSeries,
  deleteVoucherSeriesById,
  getNextVoucherSeriesNumber,
} from "../../controllers/voucherSerieController.js";

const router = express.Router();

router.get("/getSeriesByVoucher/:cmp_id", protect, requireCompanyAccess, getSeriesByVoucher);
router.post("/createVoucherSeries/:cmp_id", protect, requireCompanyAccess, createVoucherSeries);
router.put(
  "/updateVoucherSeries/:cmp_id/:seriesId",
  protect,
  requireCompanyAccess,
  updateVoucherSeries
);
router.delete(
  "/deleteVoucherSeriesById/:cmp_id",
  protect,
  requireCompanyAccess,
  deleteVoucherSeriesById
);

router.get(
  "/nextVoucherSeriesNumber/:cmp_id",
  protect,
  requireCompanyAccess,
  getNextVoucherSeriesNumber
);
router.get(
  "/saleOrders/:saleOrderId",
  protect,
  requireCompanyAccess,
  saleOrderController.getSaleOrderById
);
router.put("/saleOrders/:id", protect, requireCompanyAccess, saleOrderController.updateSaleOrder);
router.put(
  "/saleOrders/:id/cancel",
  protect,
  requireCompanyAccess,
  saleOrderController.cancelSaleOrder
);
router.post("/createSaleOrder", protect, requireCompanyAccess, saleOrderController.createSaleOrder);
export default router;
