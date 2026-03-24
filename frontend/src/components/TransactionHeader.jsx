import { forwardRef, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  AlertCircle,
  CalendarDays,
  LoaderCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useVoucherSeries } from "@/hooks/queries/voucherSeriesQueries";
import VoucherSeriesModal from "@/components/VoucherSeriesModal";
import {
  hydrateSelectedSeries,
  setTransactionDate,
  setSelectedSeries,
} from "@/store/slices/transactionSlice";

const DateIconInput = forwardRef(({ onClick }, ref) => (
  <button
    type="button"
    ref={ref}
    onClick={onClick}
    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
  >
    <CalendarDays className="h-3.5 w-3.5" />
  </button>
));

DateIconInput.displayName = "DateIconInput";

const getSafeDate = (value) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

// build separate parts from series
const getVoucherParts = (series) => {
  if (!series) {
    return { prefix: "", number: "", suffix: "" };
  }

  const number = String(series.currentNumber || 0).padStart(
    series.widthOfNumericalPart || 1,
    "0"
  );

  return {
    prefix: series.prefix || "",
    number,
    suffix: series.suffix || "",
  };
};

// only for UI (PREFIX / NUMBER / SUFFIX)
const formatVoucherForUi = ({ prefix, number, suffix }) =>
  [prefix, number, suffix].filter(Boolean).join(" / ");

export default function TransactionHeader({
  cmpId,
  numberField,
  onHeaderReady,
}) {
  const dispatch = useDispatch();
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);

  const voucherType = useSelector((state) => state.transaction.voucherType);
  const transactionDate = useSelector(
    (state) => state.transaction.transactionDate
  );
  const selectedSeries = useSelector(
    (state) => state.transaction.selectedSeries
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useVoucherSeries({ cmpId, voucherType });

  const seriesList = data?.series || [];
  const hydratedSeries =
    selectedSeries?._id
      ? seriesList.find((series) => series._id === selectedSeries._id) ||
        selectedSeries
      : null;
  const apiDefault =
    seriesList.find((series) => series.currentlySelected) ||
    seriesList[0] ||
    null;
  const effectiveSeries = hydratedSeries || apiDefault;

  const selectedDate = getSafeDate(transactionDate);
  const voucherParts = getVoucherParts(effectiveSeries);
  const voucherNumberUi = formatVoucherForUi(voucherParts);

  useEffect(() => {
    if (!cmpId) return;
    dispatch(hydrateSelectedSeries({ cmpId }));
  }, [cmpId, voucherType, dispatch]);

  useEffect(() => {
    if (transactionDate) return;
    dispatch(
      setTransactionDate({
        transactionDate: new Date().toISOString(),
      })
    );
  }, [transactionDate, dispatch]);

  useEffect(() => {
    if (!cmpId || !effectiveSeries) return;
    if (hydratedSeries?._id === effectiveSeries._id) return;

    dispatch(
      setSelectedSeries({
        cmpId,
        series: effectiveSeries,
      })
    );
  }, [cmpId, dispatch, effectiveSeries, hydratedSeries]);

  // expose clean data to parent (separated prefix/number/suffix)
  useEffect(() => {
    if (!onHeaderReady || !effectiveSeries || !transactionDate) return;

    onHeaderReady(() => () => ({
      transactionDate,
      voucherType,
      series_id: effectiveSeries._id,
      usedSeriesNumber: effectiveSeries.currentNumber,
      voucherPrefix: voucherParts.prefix,
      voucherNumber: voucherParts.number,
      voucherSuffix: voucherParts.suffix,
      // if backend still expects combined number, keep this:
      [numberField]: voucherNumberUi,
    }));
  }, [
    numberField,
    effectiveSeries,
    onHeaderReady,
    transactionDate,
    voucherType,
    voucherParts.prefix,
    voucherParts.number,
    voucherParts.suffix,
    voucherNumberUi,
  ]);

  const handleSelectSeries = (series) => {
    dispatch(setSelectedSeries({ cmpId, series }));
  };

  const handleDateChange = (date) => {
    if (!date) return;
    dispatch(
      setTransactionDate({
        transactionDate: date.toISOString(),
      })
    );
  };

  const headerMessage = !cmpId
    ? "Select a company to load transaction series."
    : isError
    ? error?.response?.data?.message ||
      error?.message ||
      "Unable to load voucher series right now."
    : null;

  return (
    <>
      <header className="bg-white px-3 py-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setIsSeriesModalOpen(true)}
                disabled={!cmpId || isError || seriesList.length === 0}
                className="mt-0.5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="font-semibold">
                  {effectiveSeries?.seriesName || "Series"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isLoading ? "Loading..." : `No: #${voucherNumberUi}`}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
              {(isLoading || isFetching) && (
                <LoaderCircle className="h-3 w-3 animate-spin text-slate-400" />
              )}
              <span className="truncate max-w-[140px]">
                {selectedDate.toDateString()}
              </span>
            </div>

            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              customInput={<DateIconInput />}
              dateFormat="yyyy-MM-dd"
              popperClassName="!z-[9999]"
              showPopperArrow={false}
              withPortal
            />
          </div>
        </div>
        {headerMessage && (
          <div className="mt-1.5 flex items-start justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{headerMessage}</span>
            </div>
            {cmpId && isError && (
              <button
                type="button"
                onClick={() => refetch()}
                className="shrink-0 rounded-full border border-rose-300 px-2 py-0.5 text-[11px] font-semibold hover:bg-rose-100"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </header>

      <VoucherSeriesModal
        key={`${cmpId || "transaction"}-${effectiveSeries?._id || "empty"}`}
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        seriesList={seriesList}
        selectedSeriesId={effectiveSeries?._id}
        onSelectSeries={handleSelectSeries}
      />
    </>
  );
}
