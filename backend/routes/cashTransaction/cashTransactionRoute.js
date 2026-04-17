import express from "express";

import {
  cancelCashTransaction,
  createCashTransaction,
  getCashBankLedgerBalances,
  getCashTransactionById,
  getCashTransactions,
} from "../../controllers/cashTransactionController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";

const router = express.Router();

router.post("/", protect, requireCompanyAccess, createCashTransaction);
router.put("/:id/cancel", protect, requireCompanyAccess, cancelCashTransaction);
router.get("/cash-bank-balances", protect, requireCompanyAccess, getCashBankLedgerBalances);
router.get("/:id", protect, requireCompanyAccess, getCashTransactionById);
router.get("/", protect, requireCompanyAccess, getCashTransactions);

export default router;
