

// controllers/voucherSeriesController.js
import VoucherSeries from "../Model/VoucherSeriesSchema.js";

export const getSeriesByVoucher = async (req, res) => {
  try {
    const { voucherType } = req.query;
    const cmp_id = req.params.cmp_id;

    if (!voucherType || !cmp_id) {
      return res
        .status(400)
        .json({ message: "voucherType and cmp_id are required" });
    }

    const seriesDoc = await VoucherSeries.findOne({
      voucherType: voucherType === "sale" ? "sales" : voucherType,
      cmp_id,
    }).lean();

    if (!seriesDoc) {
      return res
        .status(404)
        .json({ message: "No series found for this voucher type" });
    }

    // seriesDoc._id is the VoucherSeries document id (e.g. 69b1055e2a47bb531f77a46d)
    // seriesDoc.series is your array of series
    return res.status(200).json({
      voucherSeriesId: seriesDoc._id,
      series: seriesDoc.series,
    });
  } catch (error) {
    console.error("Error fetching series:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




export const createVoucherSeries = async (req, res) => {
  try {
    const { cmp_id } = req.params;
    const primary_user_id = req.user._id; // from protect middleware
    const {
      voucherType,
      seriesName,
      prefix = "",
      suffix = "",
      currentNumber = 1,
      widthOfNumericalPart,
      isDefault = false,
      under = "",
    } = req.body;

    if (!voucherType || !seriesName || !widthOfNumericalPart) {
      return res.status(400).json({
        message: "voucherType, seriesName and widthOfNumericalPart are required",
      });
    }

    // normalize "sale" -> "sales" if needed
    const normalizedVoucherType =
      voucherType === "sale" ? "sales" : voucherType;

    // find existing doc for this company + voucherType, or create new one
    let voucherSeriesDoc = await VoucherSeries.findOne({
      cmp_id,
      voucherType: normalizedVoucherType,
    });

    const newSeries = {
      seriesName,
      prefix,
      suffix,
      currentNumber,
      widthOfNumericalPart,
      isDefault,
      currentlySelected: false,
      lastUsedNumber: currentNumber,
      under,
    };

    if (!voucherSeriesDoc) {
      // create first doc for this voucherType
      voucherSeriesDoc = new VoucherSeries({
        primary_user_id,
        cmp_id,
        voucherType: normalizedVoucherType,
        series: [newSeries],
      });
    } else {
      voucherSeriesDoc.series.push(newSeries);
    }

    await voucherSeriesDoc.save();

    return res.status(201).json({
      message: "Voucher series created successfully",
      voucherSeriesId: voucherSeriesDoc._id,
      series: voucherSeriesDoc.series,
    });
  } catch (error) {
    console.error("Error creating voucher series:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const updateVoucherSeries = async (req, res) => {
  try {
    const { cmp_id, seriesId } = req.params;
    const {
      voucherType,
      seriesName,
      prefix = "",
      suffix = "",
      currentNumber,
      widthOfNumericalPart,
    } = req.body;

    if (!voucherType || !seriesName || !widthOfNumericalPart) {
      return res.status(400).json({
        message: "voucherType, seriesName and widthOfNumericalPart are required",
      });
    }

    const normalizedVoucherType =
      voucherType === "sale" ? "sales" : voucherType;

    // Find the document that has this cmp_id + voucherType and contains given seriesId
    const doc = await VoucherSeries.findOne({
      cmp_id,
      voucherType: normalizedVoucherType,
      "series._id": seriesId,
    });

    if (!doc) {
      return res
        .status(404)
        .json({ message: "Voucher series document not found" });
    }

    // Find subdocument and update fields
    const sub = doc.series.id(seriesId);
    if (!sub) {
      return res.status(404).json({ message: "Series not found" });
    }

    sub.seriesName = seriesName;
    sub.prefix = prefix;
    sub.suffix = suffix;
    if (typeof currentNumber === "number") {
      sub.currentNumber = currentNumber;
      sub.lastUsedNumber = currentNumber;
    }
    sub.widthOfNumericalPart = widthOfNumericalPart;

    await doc.save();

    return res.status(200).json({
      message: "Voucher series updated successfully",
      voucherSeriesId: doc._id,
      series: doc.series,
    });
  } catch (error) {
    console.error("Error updating voucher series:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



export const deleteVoucherSeriesById = async (req, res) => {
  try {
    const { cmp_id } = req.params;
    const { voucherType, seriesId } = req.body;

    if (!voucherType || !seriesId) {
      return res
        .status(400)
        .json({ message: "voucherType and seriesId are required" });
    }

    const normalizedVoucherType =
      voucherType === "sale" ? "sales" : voucherType;

    const result = await VoucherSeries.findOneAndUpdate(
      {
        cmp_id,
        voucherType: normalizedVoucherType,
      },
      {
        $pull: { series: { _id: seriesId } },
      },
      { new: true }
    );

    if (!result) {
      return res
        .status(404)
        .json({ message: "Voucher series document not found" });
    }

    return res.status(200).json({
      message: "Series deleted successfully",
      voucherSeriesId: result._id,
      series: result.series,
    });
  } catch (error) {
    console.error("Error deleting voucher series:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
