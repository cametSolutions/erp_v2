import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MdOutlineInsertLink } from "react-icons/md";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { toast } from "sonner";

import api from "@/api/client/apiClient";
import { formatVoucherType } from "@/utils/formatVoucherType";
import DeleteDialog from "@/components/DeleteDialog";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import { ROUTES } from "@/routes/paths";

function VoucherSeriesList() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();

  const voucherType = location?.state?.from;

  const cmp_id =
    useSelector((state) => state.company.selectedCompanyId) || "";

  // header: menu dots with "Add Series"
  useEffect(() => {
    if (!voucherType) return;

    setHeaderOptions({
      showMenuDots: true,
      menuItems: [
        {
          label: "Add Series",
          onSelect: () => {
            navigate(ROUTES.settingsVoucherSeriesCreate,  {
              state: { from: voucherType },
            });
          },
        },
      ],
      // optional: header search for series name
      // search: { ... } if you need it
    });

    return () => resetHeaderOptions();
  }, [navigate, resetHeaderOptions, setHeaderOptions, voucherType]);

  // fetch series with api.get
  useEffect(() => {
    if (!cmp_id || !voucherType) return;

    const fetchSeries = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sUsers/getSeriesByVoucher/${cmp_id}`, {
          params: { voucherType },
          withCredentials: true,
        });
        setSeries(res.data?.series || []);
      } catch (error) {
        console.error("Error fetching series:", error);
        toast.error("Failed to load voucher series");
        setSeries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [cmp_id, voucherType]);

  const handleDelete = async (seriesItem) => {
    const { _id: seriesId, isDefault } = seriesItem;

    if (isDefault) {
      alert("Cannot delete default series");
      return;
    }

    try {
      const payload = {
        voucherType,
        seriesId,
      };
      await api.delete(`/sUsers/deleteVoucherSeriesById/${cmp_id}`, {
        data: payload,
        withCredentials: true,
      });
      setSeries((prev) => prev.filter((s) => s._id !== seriesId));
      toast.success("Series deleted");
    } catch (error) {
      console.error("Failed to delete series:", error);
      toast.error("Failed to delete series");
    }
  };

  const handleEditClick = (seriesItem) => {
    navigate(ROUTES.settingsVoucherSeriesCreate,  {
      state: {
        series: seriesItem,
        from: voucherType,
        mode: "edit",
      },
    });
  };

  const formatNumber = (num, width) => {
    return num.toString().padStart(width, "0");
  };

  return (
    <section className="flex-1 text-gray-600">
      {/* simple inline title (global header will show the three dots) */}
      <div className="bg-white px-4 py-3 border-b">
        <h1 className="text-lg font-semibold text-gray-800">
          {formatVoucherType(voucherType)} Series List
        </h1>
        <p className="text-xs text-gray-500">
          Manage voucher series for this voucher type
        </p>
      </div>

      <div className="text-sm p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full mt-36">
            <h1 className="text-gray-400 font-bold">Loading...</h1>
          </div>
        ) : series.length > 0 ? (
          <div className="space-y-2 p-2">
            {series.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-sm shadow-md py-6 px-5 border"
              >
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="flex items-start gap-4">
                      <h3 className="text-sm font-bold text-gray-900 flex justify-center items-center gap-4">
                        <MdOutlineInsertLink rotate={90} size={23} />
                      </h3>
                      <div>
                        <p className="font-bold">{item?.seriesName}</p>
                        <p className="text-xs font-bold mt-1 text-gray-400">
                          {item?.prefix}
                          {formatNumber(
                            item?.currentNumber,
                            item?.widthOfNumericalPart
                          )}
                          {item?.suffix}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:text-lg">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="text-blue-500 hover:text-green-700"
                    >
                      <FaEdit />
                    </button>

                    <DeleteDialog
                      onConfirm={() => handleDelete(item)}
                      title="Delete this series?"
                      description={`This will permanently delete "${item.seriesName}".`}
                    >
                      <button className="text-red-500 hover:text-green-700">
                        <RiDeleteBin6Fill />
                      </button>
                    </DeleteDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full mt-36">
            <h1 className="text-gray-400 font-bold">No Data Found</h1>
          </div>
        )}
      </div>
    </section>
  );
}

export default VoucherSeriesList;