import { fetchBankParties } from "@/api/client/partyApi";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

export default function BankBalanceListPage() {
  const { cmp_id, Primary_user_id } = useSelector((state) => ({
    cmp_id: state.company?.selectedCompanyId || "",
    Primary_user_id: state.auth?.user?.id || "",
  }));

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["bank-parties", cmp_id, Primary_user_id],
    enabled: !!cmp_id && !!Primary_user_id,
    queryFn: () => fetchBankParties({ cmp_id, Primary_user_id }),
    onError: (err) => console.error("bank-parties error", err?.response || err),
  });

  if (!cmp_id || !Primary_user_id)
    return <div className="p-4">Loading company / user...</div>;
  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError) {
    console.log("React Query error object:", error);
    return <div className="p-4 text-red-500">Error loading data</div>;
  }

  const allItems = data?.items || [];
  const items = allItems.filter((p) => p.partyType === "bank"); // <---

  const total = items.reduce(
    (sum, p) => sum + (p.openingBalanceAmount || 0),
    0
  );

  return (
    <div className="p-4  min-h-screen text-white">
      <h1 className="text-xl font-semibold mb-4">Bank Balance</h1>
      <div className="mb-3">Total: ₹ {total.toLocaleString("en-IN")}</div>
      <div className="bg-white text-slate-900 rounded-md divide-y">
        {items.map((p) => (
          <div
            key={p._id}
            className="flex justify-between items-center px-4 py-3"
          >
            <div>
              <div>{p.partyName}</div>
              <div className="text-xs text-slate-500">
                {p.bank_name} {p.ac_no ? `• A/c ${p.ac_no}` : ""}
              </div>
            </div>
            <span>₹ {p.openingBalanceAmount.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}