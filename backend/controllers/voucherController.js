import {
  getVoucherTotalsSummary as getVoucherTotalsSummaryService,
  getVouchers as getVouchersService,
} from "../services/voucher.service.js";

export async function getVoucherTotalsSummary(req, res) {
  try {
    const summary = await getVoucherTotalsSummaryService(
      {
        date: req.query.date,
        cmpId: req.companyId,
      },
      req
    );

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("getVoucherTotalsSummary error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getVouchers(req, res) {
  try {
    const vouchers = await getVouchersService(
      {
        ...req.query,
        cmpId: req.companyId,
      },
      req
    );

    return res.json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    console.error("getVouchers error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
}

export default {
  getVouchers,
};
