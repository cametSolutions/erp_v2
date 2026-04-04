import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { MdOutlineInsertLink } from "react-icons/md";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

import api from "@/api/client/apiClient";
import { ROUTES } from "@/routes/paths";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import {
  useVoucherSeries,
  voucherSeriesKeys,
} from "@/hooks/queries/voucherSeriesQueries";

function VoucherSeriesList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const voucherType =
    location?.state?.from || searchParams.get("voucherType") || "";
  const cmp_id = useSelector((state) => state.company.selectedCompanyId) || "";
  const [seriesToDelete, setSeriesToDelete] = useState(null);
  const [deletingSeriesId, setDeletingSeriesId] = useState("");
  const { data, isLoading: loading } = useVoucherSeries({
    cmp_id: cmp_id,
    voucherType,
    enabled: Boolean(cmp_id && voucherType),
  });
  const series = data?.series || [];

  // Header setup
  useEffect(() => {
    if (!voucherType) return;

    setHeaderOptions({
      showMenuDots: true,
      menuItems: [
        {
          label: "Add Series",
          onSelect: () =>
            navigate(
              {
                pathname: ROUTES.settingsVoucherSeriesCreate,
                search: `?voucherType=${voucherType}`,
              },
              {
                state: { from: voucherType },
              },
            ),
        },
      ],
    });

    return () => resetHeaderOptions();
  }, [navigate, resetHeaderOptions, setHeaderOptions, voucherType]);

  // Handle delete
  const handleDelete = async () => {
    if (!seriesToDelete) return;

    const { _id: seriesId } = seriesToDelete;

    if (!cmp_id || !voucherType) {
      toast.error("Missing voucher type or company");
      return;
    }

    setDeletingSeriesId(seriesId);

    try {
      const res = await api.delete(
        `/sUsers/deleteVoucherSeriesById/${cmp_id}`,
        {
          data: { voucherType, seriesId },
          withCredentials: true,
        },
      );
      queryClient.setQueryData(voucherSeriesKeys.list(cmp_id, voucherType), {
        voucherSeriesId: res?.data?.voucherSeriesId,
        series: res?.data?.series || [],
      });
      await queryClient.invalidateQueries({
        queryKey: voucherSeriesKeys.list(cmp_id, voucherType),
      });
      await queryClient.invalidateQueries({
        queryKey: voucherSeriesKeys.nextNumber(cmp_id, voucherType),
      });
      toast.success(res?.data?.message || "Series deleted");
      setSeriesToDelete(null);
    } catch (error) {
      console.error("Failed to delete series:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete series",
      );
    } finally {
      setDeletingSeriesId("");
    }
  };

  const handleDeleteClick = (seriesItem) => {
    const { isDefault } = seriesItem;

    if (isDefault) {
      toast.warning("Cannot delete default series");
      return;
    }
    setSeriesToDelete(seriesItem);
  };

  const handleEditClick = (seriesItem) => {
    navigate(
      {
        pathname: ROUTES.settingsVoucherSeriesCreate,
        search: `?voucherType=${voucherType}`,
      },
      {
        state: { series: seriesItem, from: voucherType, mode: "edit" },
      },
    );
  };

  const formatNumber = (num, width) => num.toString().padStart(width, "0");

  return (
    <section className="flex-1 bg-white text-slate-700">
      {/* Header */}

      {/* Content */}
      <main className="mx-auto max-w-6xl px-2 py-5">
        {loading && (
          <div className="flex h-40 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-[2px] border-slate-300 border-t-pink-600" />
              <p className="text-xs text-slate-500">Loading voucher series…</p>
            </div>
          </div>
        )}

        {!loading && series.length === 0 && (
          <div className="flex h-56 items-center justify-center">
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-8 py-6 text-center">
              <p className="text-sm font-semibold text-slate-800">
                No series configured yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Create a series to start numbering vouchers consistently.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    {
                      pathname: ROUTES.settingsVoucherSeriesCreate,
                      search: `?voucherType=${voucherType}`,
                    },
                    {
                      state: { from: voucherType },
                    },
                  )
                }
                className="mt-3 inline-flex items-center rounded-md bg-pink-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-700"
              >
                + Add first series
              </button>
            </div>
          </div>
        )}

        {!loading && series.length > 0 && (
          <div className="space-y-3">
            {series.map((item) => {
              const formattedNumber = `${item?.prefix ?? ""}${formatNumber(
                item?.currentNumber,
                item?.widthOfNumericalPart,
              )}${item?.suffix ?? ""}`;

              return (
                <div
                  key={item._id}
                  className="rounded-sm border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
                        <MdOutlineInsertLink className="-rotate-90" size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="max-w-xs truncate text-sm font-semibold text-slate-900">
                            {item?.seriesName}
                          </p>
                          {item?.isDefault && (
                            <span className="rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] font-semibold text-emerald-700">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium tracking-[0.16em] text-slate-500">
                          {formattedNumber}
                        </p>
                      </div>
                    </div>

                    {/* Actions: icon-only */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                        aria-label="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          handleDeleteClick(item);
                        }}
                        disabled={item?.isDefault}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete"
                      >
                        <RiDeleteBin6Fill size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {seriesToDelete && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 px-4"
          onClick={() => {
            if (!deletingSeriesId) {
              setSeriesToDelete(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-delete-title"
            aria-describedby="voucher-delete-description"
            className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2">
              <h2
                id="voucher-delete-title"
                className="text-lg font-semibold text-slate-900"
              >
                Delete this series?
              </h2>
              <p
                id="voucher-delete-description"
                className="text-sm leading-6 text-slate-500"
              >
                This will permanently delete "{seriesToDelete.seriesName}".
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={Boolean(deletingSeriesId)}
                onClick={() => setSeriesToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 bg-rose-600 text-white hover:bg-rose-700"
                disabled={Boolean(deletingSeriesId)}
                onClick={handleDelete}
              >
                {deletingSeriesId ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default VoucherSeriesList;
