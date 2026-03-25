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
  <div className="min-h-screen bg-slate-50 flex flex-col">
    {/* Top bar */}
   

    {/* Content */}
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
         

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
            {/* Series Name */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                <span>
                  Series name<span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  Example: Sales 2025
                </span>
              </label>
              <input
                type="text"
                value={form.seriesName}
                onChange={handleChange("seriesName")}
                placeholder="E.g. Sales Invoice 2025"
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Prefix / Suffix */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">
                  Prefix
                </label>
                <input
                  type="text"
                  value={form.prefix}
                  onChange={handleChange("prefix")}
                  placeholder="E.g. SO-"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">
                  Suffix
                </label>
                <input
                  type="text"
                  value={form.suffix}
                  onChange={handleChange("suffix")}
                  placeholder="E.g. -25"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Number + Width */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">
                  Current number<span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.currentNumber}
                  onChange={handleChange("currentNumber")}
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-700">
                  Width of numerical part<span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.widthOfNumericalPart}
                  onChange={handleChange("widthOfNumericalPart")}
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Controls zero padding. Width 4 with value 12 → 0012.
                </p>
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-medium text-slate-600">
                Live preview
              </p>
              <p className="mt-1 text-sm font-semibold tracking-[0.18em] text-slate-900">
                {livePreview()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  navigate(ROUTES.settingsVoucherSeriesList, {
                    state: { from: voucherType },
                  })
                }
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? mode === "edit"
                    ? "Updating..."
                    : "Saving..."
                  : mode === "edit"
                  ? "Update series"
                  : "Save series"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
);
};

export default CreateVoucherSeriesPage;