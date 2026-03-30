import SaleOrder from "../Model/SaleOrder.js";

const DEFAULT_VOUCHER_TYPES = ["saleOrder"];

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseDateInput(value) {
  if (!value || typeof value !== "string") return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function resolveDateRange(from, to) {
  const today = new Date();

  if (!from && !to) {
    return {
      fromDate: startOfDay(today),
      toDate: endOfDay(today),
    };
  }

  if (from && !to) {
    const parsedFrom = parseDateInput(from);
    if (!parsedFrom) {
      throw createHttpError("Invalid from date", 400);
    }

    return {
      fromDate: startOfDay(parsedFrom),
      toDate: endOfDay(parsedFrom),
    };
  }

  const parsedFrom = parseDateInput(from);
  const parsedTo = parseDateInput(to);

  if (!parsedFrom || !parsedTo) {
    throw createHttpError("Invalid date range", 400);
  }

  if (parsedFrom > parsedTo) {
    throw createHttpError("'from' date cannot be after 'to' date", 400);
  }

  return {
    fromDate: startOfDay(parsedFrom),
    toDate: endOfDay(parsedTo),
  };
}

function resolveVoucherTypes(voucherType) {
  if (!voucherType || voucherType.toLowerCase() === "all") {
    return DEFAULT_VOUCHER_TYPES;
  }

  return voucherType
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);
}

export async function getVouchers(req, res) {
  try {
    const { cmpId, from, to, voucherType } = req.query;

    if (!cmpId) {
      return res.status(400).json({
        success: false,
        message: "cmpId is required",
      });
    }

    const { fromDate, toDate } = resolveDateRange(from, to);
    const voucherTypes = resolveVoucherTypes(voucherType);

    if (!voucherTypes.includes("saleOrder")) {
      return res.json({
        success: true,
        data: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          count: 0,
          vouchers: [],
        },
      });
    }

    const saleOrders = await SaleOrder.find(
      {
        cmp_id: cmpId,
        date: {
          $gte: fromDate,
          $lte: toDate,
        },
      },
      {
        _id: 1,
        voucher_type: 1,
        date: 1,
        voucher_number: 1,
        status: 1,
        "party_snapshot.name": 1,
        "totals.final_amount": 1,
      }
    )
      .sort({ date: -1, voucher_number: 1 })
      .lean();

    const vouchers = saleOrders.map((doc) => ({
      _id: doc._id,
      voucher_type: doc.voucher_type,
      date: doc.date,
      voucher_number: doc.voucher_number,
      party_name: doc.party_snapshot?.name || null,
      debit: 0,
      credit: Number(doc.totals?.final_amount) || 0,
      status: doc.status || null,
    }));

    return res.json({
      success: true,
      data: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        count: vouchers.length,
        vouchers,
      },
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
