import express from "express";

import {
  cancelCashTransaction,
  createCashTransaction,
  getCashTransactionById,
  getCashTransactions,
} from "../../controllers/cashTransactionController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createCashTransaction);
router.put("/:id/cancel", protect, cancelCashTransaction);
router.get("/:id", protect, getCashTransactionById);
router.get("/", protect, getCashTransactions);

export default router;
