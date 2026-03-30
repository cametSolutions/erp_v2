import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ROUTES } from "@/routes/paths";
import api from "@/api/client/apiClient";
import { voucherSeriesKeys } from "@/hooks/queries/voucherSeriesQueries";
import { formatVoucherNumber } from "@/utils/formatVoucherNumber";

const middleSeparatorPattern = /^[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)*$/;

const CreateVoucherSeriesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const voucherType =
    location?.state?.from || searchParams.get("voucherType") || "";
  const editingSeries = location?.state?.series;
  const mode = location?.state?.mode || "create";
  const isEdit = mode === "edit";

  const cmp_id =
    useSelector((state) => state.company.selectedCompanyId) || "";

  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      seriesName: "",
      prefix: "",
      suffix: "",
      currentNumber: "1",
      widthOfNumericalPart: "1",
    },
    mode: "onChange",
  });

  // PREFILL WHEN EDIT
  useEffect(() => {
    if (mode === "edit" && editingSeries) {
      reset({
        seriesName: editingSeries.seriesName || "",
        prefix: editingSeries.prefix || "",
        suffix: editingSeries.suffix || "",
        currentNumber: String(editingSeries.currentNumber ?? 1),
        widthOfNumericalPart: String(
          editingSeries.widthOfNumericalPart ?? 1,
        ),
      });
      return;
    }

    reset({
      seriesName: "",
      prefix: "",
      suffix: "",
      currentNumber: "1",
      widthOfNumericalPart: "1",
    });
  }, [mode, editingSeries, reset]);

  const formValues = watch();

  const onSubmit = async (form) => {
    if (!voucherType || !cmp_id) {
      toast.error("Missing voucher type or company");
      return;
    }
    const currentNumberValue = Number(form.currentNumber || 0);
    const widthValue = Number(form.widthOfNumericalPart || 0);

    try {
      setLoading(true);

      const basePayload = {
        voucherType,
        seriesName: form.seriesName.trim(),
        prefix: form.prefix.trim(),
        suffix: form.suffix.trim(),
        widthOfNumericalPart: widthValue,
      };

      // only send currentNumber when creating new series
      let responseData;
      const payload =
        mode === "edit"
          ? basePayload
          : {
              ...basePayload,
              currentNumber: currentNumberValue,
            };

      if (mode === "edit" && editingSeries?._id) {
        const res = await api.put(
          `/sUsers/updateVoucherSeries/${cmp_id}/${editingSeries._id}`,
          payload,
          { withCredentials: true }
        );
        responseData = res?.data;
        toast.success("Series updated successfully");
      } else {
        const res = await api.post(
          `/sUsers/createVoucherSeries/${cmp_id}`,
          payload,
          { withCredentials: true }
        );
        responseData = res?.data;
        toast.success(res.data?.message || "Series created successfully");
      }

      queryClient.setQueryData(voucherSeriesKeys.list(cmp_id, voucherType), {
        voucherSeriesId: responseData?.voucherSeriesId,
        series: responseData?.series || [],
      });
      await queryClient.invalidateQueries({
        queryKey: voucherSeriesKeys.list(cmp_id, voucherType),
      });
      await queryClient.invalidateQueries({
        queryKey: voucherSeriesKeys.nextNumber(cmp_id, voucherType),
      });

      navigate({
        pathname: ROUTES.settingsVoucherSeriesList,
        search: `?voucherType=${voucherType}`,
      }, {
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
    const rawNumber = formValues.currentNumber || "1";
    const widthValue = Number(formValues.widthOfNumericalPart || 1);
    const num = rawNumber.padStart(
      widthValue || 1,
      "0"
    );
    return formatVoucherNumber(
      formValues.prefix || "",
      num,
      formValues.suffix || "",
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-2 py-6">
          <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-5">
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
                  placeholder="E.g. Sales Invoice 2025"
                  {...register("seriesName", {
                    required: "Series Name is required",
                  })}
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                />
                {errors.seriesName && (
                  <p className="text-[11px] text-rose-500">
                    {errors.seriesName.message}
                  </p>
                )}
              </div>

              {/* Prefix / Suffix */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-700">
                    Prefix
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. FY2025/2026"
                    {...register("prefix", {
                      validate: (value) =>
                        value === "" ||
                        middleSeparatorPattern.test(value) ||
                        'Use "/" or "-" only in the middle.',
                    })}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                  />
                  {errors.prefix && (
                    <p className="text-[11px] text-rose-500">
                      {errors.prefix.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Letters and numbers only at the start or end. Use "/" or
                    "-" only in the middle.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-700">
                    Suffix
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. 2025/2026"
                    {...register("suffix", {
                      validate: (value) =>
                        value === "" ||
                        middleSeparatorPattern.test(value) ||
                        'Use "/" or "-" only in the middle.',
                    })}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                  />
                  {errors.suffix && (
                    <p className="text-[11px] text-rose-500">
                      {errors.suffix.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Letters and numbers only at the start or end. Use "/" or
                    "-" only in the middle.
                  </p>
                </div>
              </div>

              {/* Number + Width */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-700">
                    Current number<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={isEdit}
                    {...register("currentNumber", {
                      required: "Current Number is required",
                      validate: (value) => {
                        if (!/^\d+$/.test(value || "")) {
                          return "Enter digits only";
                        }
                        if (Number(value) < 1) {
                          return "Current Number must be at least 1";
                        }
                        return true;
                      },
                    })}
                    className={`w-full rounded-md border px-3 py-2 text-xs outline-none ${
                      isEdit
                        ? "bg-slate-100 border-slate-200 text-slate-500"
                        : "bg-slate-50 border-slate-300 focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                    }`}
                  />
                  {errors.currentNumber && (
                    <p className="text-[11px] text-rose-500">
                      {errors.currentNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-700">
                    Width of numerical part<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    {...register("widthOfNumericalPart", {
                      required: "Width of Numerical Part is required",
                      validate: (value) => {
                        if (!/^\d+$/.test(value || "")) {
                          return "Enter digits only";
                        }
                        if (Number(value) < 1) {
                          return "Width of Numerical Part must be at least 1";
                        }
                        if (Number(value) > 5) {
                          return "Width of Numerical Part cannot exceed 5";
                        }
                        return true;
                      },
                    })}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
                  />
                  {errors.widthOfNumericalPart && (
                    <p className="text-[11px] text-rose-500">
                      {errors.widthOfNumericalPart.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Controls zero padding. Width 4 with value 12 → 0012. Max 5.
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
                    navigate({
                      pathname: ROUTES.settingsVoucherSeriesList,
                      search: `?voucherType=${voucherType}`,
                    }, {
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
                  className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
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
