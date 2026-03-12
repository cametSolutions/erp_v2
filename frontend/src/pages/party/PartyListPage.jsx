// src/pages/party/PartyListPage.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { FaUserFriends, FaEdit, FaTrash } from "react-icons/fa";
import {
  fetchParties,
  deleteParty,
} from "../../api/client/partyApi";
import { useNavigate } from "react-router-dom";

const PartyCard = ({ party, onDeleted }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/party/register?partyId=${party._id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this party?")) return;
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const loaderRef = useRef(null);

  const cmp_id = localStorage.getItem("activeCompanyId");

  const loadPage = useCallback(
    async (pageToLoad) => {
      if (!hasMore && pageToLoad !== 1) return;
      try {
        setLoadingPage(true);
        const res = await fetchParties({ page: pageToLoad, limit: 20, cmp_id });
        const { items, hasMore: newHasMore } = res.data;
        if (pageToLoad === 1) {
          setParties(items);
        } else {
          setParties((prev) => [...prev, ...items]);
        }
        setHasMore(newHasMore);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err.message ||
          "Failed to load parties";
        toast.error(msg);
      } finally {
        setLoadingPage(false);
      }
    },
    [cmp_id, hasMore]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const el = loaderRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingPage) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPage(nextPage);
        }
      },
      { threshold: 1 }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [page, hasMore, loadingPage, loadPage]);

  const handleDeleted = (id) => {
    setParties((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="font-[sans-serif] w-full">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Parties
          </h2>
        </div>

        {parties.map((p) => (
          <PartyCard key={p._id} party={p} onDeleted={handleDeleted} />
        ))}

        <div ref={loaderRef} className="h-8 flex items-center justify-center">
          {loadingPage && (
            <p className="text-xs text-gray-500">Loading more...</p>
          )}
          {!hasMore && !loadingPage && parties.length > 0 && (
            <p className="text-xs text-gray-400">No more parties</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartyListPage;
