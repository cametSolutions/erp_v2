import express from "express";

import {
  createTaxClassification,
  deleteTaxClassification,
  getTaxClassificationById,
  listTaxClassifications,
  updateTaxClassification,
} from "../../controllers/taxClassificationController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";

const router = express.Router();

// Company and owner are server-derived. Removing client ownership fields before
// shared access resolution prevents a forged body cmp_id from taking precedence.
const discardClientOwnership = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    delete req.body.cmp_id;
    delete req.body.cmpId;
    delete req.body.Primary_user_id;
  }
  next();
};

router.get("/", protect, discardClientOwnership, requireCompanyAccess, listTaxClassifications);
router.get("/:id", protect, discardClientOwnership, requireCompanyAccess, getTaxClassificationById);
router.post("/", protect, discardClientOwnership, requireCompanyAccess, createTaxClassification);
router.put("/:id", protect, discardClientOwnership, requireCompanyAccess, updateTaxClassification);
router.delete("/:id", protect, discardClientOwnership, requireCompanyAccess, deleteTaxClassification);

export default router;
