import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { deleteUser } from "../../api/client/userApi";
import { useUserOptionsQuery, userQueryKeys } from "@/hooks/queries/userQueries";
import { useDeleteConfirm } from "@/components/common/deleteConfirmContext";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/routes/paths";

function UserRow({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmDelete = useDeleteConfirm();

  const handleEdit = () => {
    navigate(`${ROUTES.mastersUserRegister}?userId=${user.id}`, {
      replace: true,
    });
  };

  const handleDelete = async () => {
    const ok = await confirmDelete({
      title: "Delete this user?",
      description:
        "This staff account will be removed permanently. This action cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      const res = await deleteUser(user.id);
      toast.success(res?.data?.message || "User deleted");
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Delete failed";
      toast.error(msg);
    }
  };

  const subtitle = [user?.email, user?.mobile].filter(Boolean).join(" | ");

  return (
    <Card className="rounded border-none bg-slate-50 py-1 shadow-lg ring-0">
      <CardContent className="flex items-center justify-between gap-3 p-3.5">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {user?.name || "Untitled User"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {subtitle || "No contact details"}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {user?.role || "Staff"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
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
}

export default function UserListPage() {
  const navigate = useNavigate();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const {
    data: users = [],
    isLoading,
    isError,
    error,
     refetch,
  } = useUserOptionsQuery(true);

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setHeaderOptions({
      showMenuDots: true,
      menuItems: [
        {
          label: "Add User",
          onSelect: () =>
            navigate(ROUTES.mastersUserRegister, { replace: true }),
        },
      ],
      search: {
        show: true,
        value: searchText,
        placeholder: "Search users",
        onChange: setSearchText,
      },
    });

    return () => resetHeaderOptions();
  }, [navigate, resetHeaderOptions, searchText, setHeaderOptions, setSearchText]);

  useEffect(() => {
    if (!isError) return;
    toast.error(error?.message || "Failed to load users");
  }, [error, isError]);

  const filteredUsers = useMemo(() => {
    const q = String(searchText || "").trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      const haystack = [user?.name, user?.email, user?.mobile, user?.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [searchText, users]);


if (isError) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load users";

    return (
      <div className="w-full font-[sans-serif]">
        <div className="mx-auto w-full max-w-md rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1">{msg}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Retry
          </button>
          {/* Debug view (optional while developing) */}
          {/* <pre className="mt-2 max-h-40 overflow-auto rounded bg-white/70 p-2 text-[10px] text-slate-800">
            {JSON.stringify(error, null, 2)}
          </pre> */}
        </div>
      </div>
    );
  }



  return (
    <div className="w-full font-[sans-serif]">
      <div className="mx-auto w-full max-w-md space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            {searchText ? "No matching users" : "No users found"}
          </div>
        )}

        {!isLoading && filteredUsers.length > 0 && (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
