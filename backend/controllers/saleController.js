import { createSale as createSaleService } from "../services/sale.service.js";

export async function createSale(req, res) {
  try {
    const sale = await createSaleService(req.body || {}, req);
    return res.status(201).json({ success: true, data: { sale } });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") console.error("createSale error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to create sale" });
  }
}
