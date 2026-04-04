import express from "express";

import {
  getPrintConfiguration,
  updatePrintConfiguration,
} from "../../controllers/printConfigController.js";

const router = express.Router();

router.get("/:cmp_id/:voucher_type", getPrintConfiguration);
router.patch("/:cmp_id/:voucher_type", updatePrintConfiguration);

export default router;
