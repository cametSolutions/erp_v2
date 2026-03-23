// src/pages/settings/CreateVoucherSeriesPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import api from "@/api/client/apiClient";
import { formatVoucherType } from "@/utils/formatVoucherType";
import { ROUTES } from "@/routes/paths";

const CreateVoucherSeriesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const voucherType = location?.state?.from;        // "saleOrder"
  const editingSeries = location?.state?.series;    // object when editing
  const mode = location?.state?.mode || "create";   // "edit" | "create"

  const cmp_id =
    useSelector((state) => state.company.selectedCompanyId) || "";

  const [form, setForm] = useState({
    seriesName: "",
    prefix: "",
    suffix: "",
    currentNumber: 1,
    widthOfNumericalPart: 1,
  });
  const [loading, setLoading] = useState(false);

  // PREFILL WHEN EDIT
  useEffect(() => {
    if (mode === "edit" && editingSeries) {
      setForm({
        seriesName: editingSeries.seriesName || "",
        prefix: editingSeries.prefix || "",
        suffix: editingSeries.suffix || "",
        currentNumber: editingSeries.currentNumber ?? 1,
        widthOfNumericalPart: editingSeries.widthOfNumericalPart ?? 1,
      });
    }
  }, [mode, editingSeries]);

  const handleChange = (field) => (e) => {
    const value =
      field === "currentNumber" || field === "widthOfNumericalPart"
        ? Number(e.target.value || 0)
        : e.target.value;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!voucherType || !cmp_id) {
      toast.error("Missing voucher type or company");
      return;
    }

    if (!form.seriesName.trim()) {
      toast.error("Series Name is required");
      return;
    }
    if (!form.widthOfNumericalPart || form.widthOfNumericalPart < 1) {
      toast.error("Width of Numerical Part must be at least 1");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        voucherType,
        seriesName: form.seriesName.trim(),
        prefix: form.prefix.trim(),
        suffix: form.suffix.trim(),
        currentNumber: form.currentNumber || 1,
        widthOfNumericalPart: form.widthOfNumericalPart,
      };

      if (mode === "edit" && editingSeries?._id) {
        // call your UPDATE API here (you need such a controller)
        await api.put(
          `/sUsers/updateVoucherSeries/${cmp_id}/${editingSeries._id}`,
          payload,
          { withCredentials: true }
        );
        toast.success("Series updated successfully");
      } else {
        // create
        const res = await api.post(
          `/sUsers/createVoucherSeries/${cmp_id}`,
          payload,
          { withCredentials: true }
        );
        toast.success(res.data?.message || "Series created successfully");
      }

      navigate(ROUTES.settingsVoucherSeriesList, {
        state: { from: voucherType },
        replace: true,
      });
    } catch (error) {
      console.error("Error saving series:", error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to save series";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const livePreview = () => {
    const num = String(form.currentNumber || 1).padStart(
      form.widthOfNumericalPart || 1,
      "0"
    );
    return `${form.prefix || ""}${num}${form.suffix || ""}`;
  };

  return (
    <div className="flex-1 bg-slate-50">
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold">
          {formatVoucherType(voucherType)} Series
          {mode === "edit" ? " (Edit)" : " (Create)"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl px-4 py-6 space-y-5"
      >
        {/* fields exactly as you already have */}
        {/* Series Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Series Name<span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.seriesName}
            onChange={handleChange("seriesName")}
            placeholder="E.g., Sales Invoice Series 2025"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Prefix / Suffix */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={form.prefix}
              onChange={handleChange("prefix")}
              placeholder="E.g., SO-"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Suffix
            </label>
            <input
              type="text"
              value={form.suffix}
              onChange={handleChange("suffix")}
              placeholder="E.g., -2025"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Current Number / Width */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Number<span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.currentNumber}
              onChange={handleChange("currentNumber")}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Width of Numerical Part<span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.widthOfNumericalPart}
              onChange={handleChange("widthOfNumericalPart")}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded border border-slate-200 bg-slate-100 px-4 py-3">
          <p className="text-xs font-medium text-slate-600 mb-1">
            Live Preview:
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {livePreview()}
          </p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-pink-600 py-2 text-sm font-semibold text-white shadow hover:bg-pink-700 disabled:opacity-60"
          >
            {loading
              ? mode === "edit"
                ? "Updating..."
                : "Saving..."
              : mode === "edit"
              ? "Update Series"
              : "Save Series"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateVoucherSeriesPage;