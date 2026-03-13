// src/pages/users/UserListPage.jsx
import React from "react";
import { toast } from "sonner";
import { FaUser, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { deleteUser } from "../../api/client/userApi";
import { confirmDelete } from "../../lib/confirmDelete";
import { useUserOptionsQuery } from "@/hooks/queries/userQueries";

const UserCard = ({ user, onDeleted }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/users/create?userId=${user.id}`);
  };

  const handleDelete = async () => {
    const ok = await confirmDelete("Delete this user?");
    if (!ok) return;

    try {
      const res = await deleteUser(user.id);
      toast.success(res.data.message || "User deleted");
      onDeleted(user.id);
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
          <FaUser size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500">
            {user.userName}
          </h3>
          
          <p className="text-xs text-gray-500">
            {user.email} • {user.mobileNumber}
          </p>
          <p className="text-xs text-gray-400 capitalize">
            Role: {user.role}
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

const UserListPage = () => {
  const { data: users = [], isLoading, isError, error } = useUserOptionsQuery();

  const handleDeleted = () => {
    // React Query will refetch or you can use onSuccess invalidate; here
    // we rely on invalidation from delete mutation if you add it later.
  };

  if (isError) {
    toast.error(error?.message || "Failed to load users");
  }

  return (
    <div className="font-[sans-serif] w-full">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Users
          </h2>
        </div>

        {isLoading && users.length === 0 && (
          <p className="text-sm text-gray-500">Loading...</p>
        )}

        {!isLoading && users.length === 0 && (
          <p className="text-sm text-gray-500">No users found.</p>
        )}

        {users.map((u) => (
          <UserCard key={u.id} user={u} onDeleted={handleDeleted} />
        ))}
      </div>
    </div>
  );
};

export default UserListPage;
