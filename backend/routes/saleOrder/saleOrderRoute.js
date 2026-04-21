import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";
import * as saleOrderController from "../../controllers/saleOrderController.js";

const router = express.Router();

router.post("/", protect, requireCompanyAccess, saleOrderController.createSaleOrder);
router.get(
  "/:saleOrderId",
  protect,
  requireCompanyAccess,
  saleOrderController.getSaleOrderById,
);
router.put(
  "/:saleOrderId",
  protect,
  requireCompanyAccess,
  saleOrderController.updateSaleOrder,
);
router.put(
  "/:saleOrderId/cancel",
  protect,
  requireCompanyAccess,
  saleOrderController.cancelSaleOrder,
);

export default router;
