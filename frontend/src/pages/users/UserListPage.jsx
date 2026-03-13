// src/pages/users/UserListPage.jsx
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { FaUser, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  fetchUsers,
  deleteUser,
} from "../../api/client/userApi";
import { useDeleteConfirm } from "@/components/common/DeleteConfirmProvider";
import { ROUTES } from "@/routes/paths";

const UserCard = ({ user, onDeleted }) => {
  const navigate = useNavigate();
  const confirmDelete = useDeleteConfirm();

  const handleEdit = () => {
    navigate(`${ROUTES.usersCreate}?userId=${user._id}`);
  };

 const handleDelete = async () => {
  const ok = await confirmDelete({
    title: "Delete this user?",
    description:
      "This user will be removed permanently. This action cannot be undone.",
  });
  if (!ok) return;

  try {
    const res = await deleteUser(user._id);
    toast.success(res.data.message || "User deleted");
    onDeleted(user._id);
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
          <h3 className="text-sm font-semibold text-gray-900">
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchUsers();
      setUsers(res.data || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to load users";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleted = (id) => {
    setUsers((prev) => prev.filter((u) => u._id !== id));
  };

  return (
    <div className="font-[sans-serif] w-full">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Users
          </h2>
        </div>

        {loading && users.length === 0 && (
          <p className="text-sm text-gray-500">Loading...</p>
        )}

        {!loading && users.length === 0 && (
          <p className="text-sm text-gray-500">No users found.</p>
        )}

        {users.map((u) => (
          <UserCard key={u._id} user={u} onDeleted={handleDeleted} />
        ))}
      </div>
    </div>
  );
};

export default UserListPage;
