import express from "express";

import {
  cancelCashTransaction,
  createCashTransaction,
  getCashBankLedgerBalances,
  getCashTransactionById,
  getCashTransactions,
} from "../../controllers/cashTransactionController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createCashTransaction);
router.put("/:id/cancel", protect, cancelCashTransaction);
router.get("/cash-bank-balances", protect, getCashBankLedgerBalances);
router.get("/:id", protect, getCashTransactionById);
router.get("/", protect, getCashTransactions);

export default router;
