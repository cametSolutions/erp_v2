// src/pages/party/PartyListPage.jsx
import React, { useState } from "react";
import { toast } from "sonner";
import { FaUserFriends, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { confirmDelete } from "../../lib/confirmDelete";
import { partyService } from "@/api/services/party.service";
import { usePartyListQuery } from "@/hooks/queries/partyQueries";

const PartyCard = ({ party }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/party/register?partyId=${party._id}`);
  };

  const handleDelete = async () => {
    const ok = await confirmDelete("Delete this party?");
    if (!ok) return;

    try {
      const res = await partyService.deleteParty(party._id);
      toast.success(res.message || "Party deleted");
      // Ideally: invalidate queries here via a mutation hook
      window.location.reload(); // quick-and-dirty until you add mutation + invalidate
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
  const [page, setPage] = useState(1);
  const cmp_id =
    localStorage.getItem("activeCompanyId") || "69b1055e2a47bb531f77a469";

  const {
    data,
    isLoading,
    isError,
    error,
  } = usePartyListQuery({ cmp_id, page, limit: 20 });

  const items = data?.items || [];
  const hasMore = data?.hasMore;

  if (isError) {
    toast.error(error?.message || "Failed to load parties");
  }

  const handleLoadMore = () => {
    if (hasMore) {
      setPage((p) => p + 1);
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

        {isLoading && items.length === 0 && (
          <p className="text-sm text-gray-500">Loading...</p>
        )}

        {items.length === 0 && !isLoading && (
          <p className="text-sm text-gray-500">No parties found.</p>
        )}

        {items.map((p) => (
          <PartyCard key={p._id} party={p} />
        ))}

        {hasMore && items.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <p className="mt-2 text-center text-xs text-gray-400">
            No more parties
          </p>
        )}
      </div>
    </div>
  );
};

export default PartyListPage;
