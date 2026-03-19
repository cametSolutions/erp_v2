import express from "express";

import {
  getProductById,
  listBrands,
  listCategories,
  listProducts,
  listSubcategories,
} from "../../controllers/productController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/brands", protect, listBrands);
router.get("/categories", protect, listCategories);
router.get("/subcategories", protect, listSubcategories);
router.get("/", protect, listProducts);
router.get("/:id", protect, getProductById);

export default router;
