// controllers/tallyController.js
import mongoose from "mongoose";
import Receipt from "../../Model/Receipt.js";
import SaleOrder from "../../Model/SaleOrder.js";

// Shared export helper:
// returns all docs where company-level serial is greater than the provided serial.
const fetchBySerial = async (Model, cmp_id, sno, res, label) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(cmp_id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid cmp_id",
      });
    }

    const parsedSerial = Number(sno);

    if (!Number.isInteger(parsedSerial) || parsedSerial < 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid serial number",
      });
    }

    const docs = await Model.find({
      cmp_id,
      company_level_serial_number: { $gt: parsedSerial },
    })
      .sort({ company_level_serial_number: 1 })
      .lean();

    if (!docs.length) {
      return res.status(404).json({
        status: false,
        message: `${label} not found`,
      });
    }

    return res.status(200).json({
      status: true,
      message: `${label} fetched`,
      data: docs,
    });
  } catch (error) {
    console.error(`fetchBySerial ${label} error:`, error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Export sale orders after serial `sno` for Tally pull.
export const getSaleOrdersForTally = async (req, res) => {
  const { cmp_id, sno } = req.params;
  return fetchBySerial(SaleOrder, cmp_id, sno, res, "saleOrder");
};

// Export receipts after serial `sno` for Tally pull.
export const getReceiptsForTally = async (req, res) => {
  const { cmp_id, sno } = req.params;
  return fetchBySerial(Receipt, cmp_id, sno, res, "receipt");
};
