// routes/company/companyRoute.js
import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { registerCompany,getCompanies,updateCompany,deleteCompany,getCompanyById } from "../../controllers/OrgaizationController.js";

const router = express.Router();

router.post("/register", protect, registerCompany);
router.get("/", protect, getCompanies);          // list
router.put("/:id", protect, updateCompany);      // edit
router.delete("/:id", protect, deleteCompany);   // delete
router.get("/:id", protect, getCompanyById);
export default router;
