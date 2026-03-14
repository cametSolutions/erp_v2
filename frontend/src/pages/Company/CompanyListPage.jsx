import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Pencil, Trash2 } from "lucide-react";

import { deleteCompany } from "../../api/client/companyApi";
import { useDeleteConfirm } from "@/components/common/DeleteConfirmProvider";
import { Card, CardContent } from "@/components/ui/card";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import {
  companyQueryKeys,
  useCompanyListQuery,
} from "@/hooks/queries/companyQueries";
import companyIcon from "../../assets/icons/company.png";
import { ROUTES } from "@/routes/paths";

const CompanyRow = ({ company }) => {
  const navigate = useNavigate();
  const confirmDelete = useDeleteConfirm();
  const queryClient = useQueryClient();
  const companyName = company?.name || "Untitled Company";
  const location = [company?.place, company?.state].filter(Boolean).join(", ");


  const handleEdit = () => {
    navigate(`${ROUTES.mastersCompanyRegister}?companyId=${company._id}`);
  };

  const handleDelete = async () => {
    const ok = await confirmDelete({
      title: "Delete this company?",
      description:
        "This company will be removed permanently. This action cannot be undone.",
    });
    if (!ok) return;

    try {
      const res = await deleteCompany(company._id);
      toast.success(res.data.message || "Company deleted");
      queryClient.setQueryData(companyQueryKeys.list(), (previous = []) =>
        previous.filter((item) => item._id !== company._id),
      );
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Delete failed";
      toast.error(msg);
    }
  };

  return (
    <Card className="rounded border-none ring-0 bg-slate-50 shadow-lg py-1">
      <CardContent className="flex items-center justify-between gap-3 p-3.5">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
          <img src={companyIcon} alt="Company" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{companyName}</p>
            <p className="truncate text-xs text-slate-500">{location || "No location"}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleEdit}
            className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md p-2 text-rose-600 transition-colors hover:bg-rose-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

const CompanyListPage = () => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const {
    data: companies = [],
    isLoading,
    error,
  } = useCompanyListQuery();

  useEffect(() => {
    setHeaderOptions({
      showMenuDots: true,
      menuItems: [
        {
          label: "Add Company",
          onSelect: () => navigate(ROUTES.mastersCompanyRegister),
        },
      ],
      search: {
        show: true,
        value: searchText,
        placeholder: "Search companies",
        onChange: setSearchText,
      },
    });

    return () => resetHeaderOptions();
  }, [navigate, resetHeaderOptions, searchText, setHeaderOptions]);

  useEffect(() => {
    if (!error) return;

    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load companies";
    toast.error(msg);
  }, [error]);

  const filteredCompanies = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((company) => {
      const haystack = [
        company?.name,
        company?.place,
        company?.state,
        company?.email,
        company?.mobile,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [companies, searchText]);

  return (
    <div className="w-full font-[sans-serif]">
      <div className="mx-auto w-full max-w-md space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        )}

        {!isLoading && filteredCompanies.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            {searchText ? "No matching companies" : "No companies found"}
          </div>
        )}

        {!isLoading && filteredCompanies.length > 0 && (
          <div className="space-y-2">
            {filteredCompanies.map((company) => (
              <CompanyRow key={company._id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyListPage;
