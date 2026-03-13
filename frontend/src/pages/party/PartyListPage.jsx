// src/pages/party/PartyListPage.jsx
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { FaUserFriends, FaEdit, FaTrash } from "react-icons/fa";
import {
  fetchParties,
  deleteParty,
} from "../../api/client/partyApi";
import { useNavigate } from "react-router-dom";
import { useDeleteConfirm } from "@/components/common/DeleteConfirmProvider";
import { ROUTES } from "@/routes/paths";

const PartyCard = ({ party, onDeleted }) => {
  const navigate = useNavigate();
  const confirmDelete = useDeleteConfirm();

  const handleEdit = () => {
    navigate(`${ROUTES.mastersPartyRegister}?partyId=${party._id}`);
  };

  const handleDelete = async () => {
  const ok = await confirmDelete({
    title: "Delete this party?",
    description:
      "This party will be removed permanently. This action cannot be undone.",
  });
  if (!ok) return;

  try {
    const res = await deleteParty(party._id);
    toast.success(res.data.message || "Party deleted");
    onDeleted(party._id);
  } catch (err) {
    const msg =
      err?.response?.data?.message || err.message || "Delete failed";
    toast.error(msg);
  }
};

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between mb-3 w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
          <FaUserFriends size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {party.partyName}
          </h3>
          <p className="text-xs text-gray-500">
            {party.mobileNumber || "No mobile"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleEdit}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          title="Edit"
        >
          <FaEdit size={14} />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded-full hover:bg-red-50 text-red-600"
          title="Delete"
        >
          <FaTrash size={14} />
        </button>
      </div>
    </div>
  );
};

const PartyListPage = () => {
  const [parties, setParties] = useState([]);
  const [page, setPage] = useState(1);        // optional if you want load more
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const cmp_id =
  localStorage.getItem("activeCompanyId") || "69b1055e2a47bb531f77a469";

  const loadParties = async (pageToLoad = 1) => {
    if (!cmp_id) {
      toast.error("No active company selected");
      return;
    }
    try {
      setLoading(true);
      const res = await fetchParties({
        page: pageToLoad,
        limit: 20,
        cmp_id,
      });
      const { items, hasMore: newHasMore } = res.data;

      setParties((prev) =>
        pageToLoad === 1 ? items : [...prev, ...items]
      );
      setHasMore(newHasMore);
      setPage(pageToLoad);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to load parties";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleted = (id) => {
    setParties((prev) => prev.filter((p) => p._id !== id));
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadParties(page + 1);
    }
  };

  return (
    <div className="font-[sans-serif] w-full">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Parties
          </h2>
        </div>

        {loading && parties.length === 0 && (
          <p className="text-sm text-gray-500">Loading...</p>
        )}

        {parties.length === 0 && !loading && (
          <p className="text-sm text-gray-500">No parties found.</p>
        )}

        {parties.map((p) => (
          <PartyCard key={p._id} party={p} onDeleted={handleDeleted} />
        ))}

        {/* Optional: simple Load More button */}
        {hasMore && parties.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="px-4 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}

        {!hasMore && parties.length > 0 && (
          <p className="mt-2 text-center text-xs text-gray-400">
            No more parties
          </p>
        )}
      </div>
    </div>
  );
};

export default PartyListPage;
