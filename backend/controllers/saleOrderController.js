import {
  cancelSaleOrder as cancelSaleOrderService,
  createSaleOrder as createSaleOrderService,
  getSaleOrderById as getSaleOrderByIdService,
  updateSaleOrder as updateSaleOrderService,
} from "../services/saleOrder.service.js";

export async function createSaleOrder(req, res) {
  try {
    const body = req.body || {};
    const createdSaleOrder = await createSaleOrderService(
      {
        ...body,
        cmpId: req.companyId,
        userId: req.user?._id || req.user?.id || null,
      },
      req
    );

    return res.status(201).json({
      success: true,
      data: {
        saleOrder: createdSaleOrder,
      },
    });
  } catch (error) {
    console.error("createSaleOrder error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create sale order",
    });
  }
}

export async function getSaleOrderById(req, res) {
  try {
    const { saleOrderId } = req.params;
    const cmpId = req.companyId;

    if (!saleOrderId) {
      return res.status(400).json({
        success: false,
        message: "saleOrderId is required",
      });
    }

    const saleOrder = await getSaleOrderByIdService(
      saleOrderId,
      { cmp_id: cmpId },
      req
    );

    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: "Sale order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        saleOrder,
      },
    });
  } catch (error) {
    console.error("getSaleOrderById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sale order",
    });
  }
}

export async function updateSaleOrder(req, res) {
  try {
    const saleOrderId = req.params.saleOrderId || req.params.id;
    const body = req.body || {};
    const cmpId = req.companyId;

    if (!saleOrderId || !cmpId) {
      return res.status(400).json({
        success: false,
        message: "saleOrderId and cmpId are required",
      });
    }

    const updatedSaleOrder = await updateSaleOrderService(
      saleOrderId,
      {
        ...body,
        cmpId,
        userId: req.user?._id || req.user?.id || null,
      },
      req
    );

    return res.status(200).json({
      success: true,
      data: {
        saleOrder: updatedSaleOrder,
      },
    });
  } catch (error) {
    console.error("updateSaleOrder error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update sale order",
    });
  }
}

export async function cancelSaleOrder(req, res) {
  try {
    const saleOrderId = req.params.saleOrderId || req.params.id;
    const cmpId = req.companyId;

    if (!saleOrderId || !cmpId) {
      return res.status(400).json({
        success: false,
        message: "saleOrderId and cmpId are required",
      });
    }

    const cancelledSaleOrder = await cancelSaleOrderService(
      saleOrderId,
      {
        cmpId,
        userId: req.user?._id || req.user?.id || null,
      },
      req
    );

    return res.status(200).json({
      success: true,
      message: "Sale order cancelled successfully",
      data: {
        saleOrder: cancelledSaleOrder,
      },
    });
  } catch (error) {
    console.error("cancelSaleOrder error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to cancel sale order",
    });
  }
}

export default {
  createSaleOrder,
  getSaleOrderById,
  updateSaleOrder,
  cancelSaleOrder,
};
