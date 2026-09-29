import express from "express";

import {
  cancelCashTransaction,
  createCashTransaction,
  getCashBankLedgerBalances,
  getCashBankLedgerTransactions,
  getCashTransactionById,
  getCashTransactions,
} from "../../controllers/cashTransactionController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";

const router = express.Router();

// Create cash transaction (currently receipt-only as per controller validation).
router.post("/", protect, requireCompanyAccess, createCashTransaction);

// Soft-cancel receipt by id.
router.put("/:id/cancel", protect, requireCompanyAccess, cancelCashTransaction);

// Fetch computed balances for cash/bank ledgers in selected company scope.
router.get("/cash-bank-balances", protect, requireCompanyAccess, getCashBankLedgerBalances);

// Must be registered before /:id so "cash-bank" is never treated as an ID.
router.get("/cash-bank/:cashBankId/transactions", protect, requireCompanyAccess, getCashBankLedgerTransactions);

// Fetch one receipt by id.
router.get("/:id", protect, requireCompanyAccess, getCashTransactionById);

// List receipts/cash transactions with optional filters.
router.get("/", protect, requireCompanyAccess, getCashTransactions);

export default router;
