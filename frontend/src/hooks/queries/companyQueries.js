import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/api/services/company.service";

export const companyQueryKeys = {
  all: ["companies"],
  list: () => [...companyQueryKeys.all, "list"],
  detail: (companyId) => [...companyQueryKeys.all, "detail", companyId],
};

export const useCompanyOptionsQuery = (enabled = true) =>
  useQuery({
    queryKey: companyQueryKeys.list(),
    queryFn: companyService.getCompanies,
    enabled,
    select: (companies) =>
      (companies || []).map((company) => ({
        id: company?._id || company?.id,
        name: company?.name || "Untitled Company",
      })),
    staleTime: 30 * 1000,
  });

export const useCompanyByIdQuery = (companyId, enabled = true) =>
  useQuery({
    queryKey: companyQueryKeys.detail(companyId),
    queryFn: () => companyService.getCompanyById(companyId),
    enabled: Boolean(companyId) && enabled,
    staleTime: 30 * 1000,
  });
