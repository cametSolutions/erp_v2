// src/pages/company/CompanyListPage.jsx
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { FaBuilding, FaEdit, FaTrash } from "react-icons/fa";
import {
  fetchCompanies,
  deleteCompany,
} from "../../api/client/companyApi";
import { useNavigate } from "react-router-dom";

const CompanyCard = ({ company, onDeleted }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/company/register?companyId=${company._id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this company?")) return;
    try {
      const res = await deleteCompany(company._id);
      toast.success(res.data.message || "Company deleted");
      onDeleted(company._id);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Delete failed";
      toast.error(msg);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between mb-3 w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
          <FaBuilding size={18} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">
          {company.name}
        </h3>
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

const CompanyListPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetchCompanies();
      setCompanies(res.data || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to load companies";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleDeleted = (id) => {
    setCompanies((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div className="font-[sans-serif] w-full">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Registered Companies
        </h2>

        {loading && <p className="text-sm text-gray-500">Loading...</p>}

        {!loading && companies.length === 0 && (
          <p className="text-sm text-gray-500">No companies found.</p>
        )}

        {!loading &&
          companies.map((c) => (
            <CompanyCard key={c._id} company={c} onDeleted={handleDeleted} />
          ))}
      </div>
    </div>
  );
};

export default CompanyListPage;
