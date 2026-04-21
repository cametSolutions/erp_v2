import {
  getGlobalLsp as getGlobalLspService,
  getPartyLsp as getPartyLspService,
} from "../services/pricing.service.js";

export const getPartyLsp = async (req, res) => {
  try {
    const { partyId, productId } = req.query;

    if (!partyId || !productId) {
      return res
        .status(400)
        .json({ message: "partyId and productId are required" });
    }

    const result = await getPartyLspService({ partyId, productId }, req);
    return res.json(result);
  } catch (error) {
    console.error("getPartyLsp error:", error);
    return res.status(500).json({ message: "Failed to fetch party LSP" });
  }
};

export const getGlobalLsp = async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const result = await getGlobalLspService({ productId }, req);
    return res.json(result);
  } catch (error) {
    console.error("getGlobalLsp error:", error);
    return res.status(500).json({ message: "Failed to fetch global LSP" });
  }
};
