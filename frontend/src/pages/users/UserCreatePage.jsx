// src/pages/users/UserCreatePage.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "../../api/client/apiClient";
import { FaUser } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";
import { useSearchParams, useNavigate } from "react-router-dom";
import { updateUser } from "../../api/client/userApi";
import { useUserByIdQuery } from "@/hooks/queries/userQueries";
import { ROUTES } from "@/routes/paths";

const schema = z.object({
  userName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  mobileNumber: z
    .string()
    .min(7, "Mobile is required")
    .regex(/^\d+$/, "Mobile must be digits"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain upper, lower, number & special char"
    )
    .optional(),
  role: z.enum(["admin", "staff"]).default("staff"),
});

const UserCreatePage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId");
  const isEdit = Boolean(userId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "staff",
    },
  });

  const {
    data: user,
    isLoading: loadingUser,
    isError,
    error,
  } = useUserByIdQuery(userId, isEdit);

  useEffect(() => {
    if (isError) {
      toast.error(error?.message || "Failed to load user");
    }
  }, [isError, error]);

  useEffect(() => {
    if (!user) return;
    reset({
      userName: user.userName || "",
      email: user.email || "",
      mobileNumber: user.mobileNumber || "",
      role: user.role || "staff",
    });
  }, [user, reset]);

  const onSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        userName: values.userName.trim(),
        email: values.email.trim(),
        mobileNumber: values.mobileNumber.trim(),
        role: values.role,
      };

      if (!isEdit || values.password) {
        payload.password = values.password;
      }

      if (isEdit) {
        const res = await updateUser(userId, payload);
        toast.success(res.data.message || "User updated successfully");
      } else {
        const res = await api.post("/users/staff", payload);
        toast.success(res.data.message || "User created successfully");
        reset({ role: "staff" });
      }

      navigate(ROUTES.usersList);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "User save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-[sans-serif]">
      <div className="max-w-xl mx-auto bg-white shadow-xl rounded-xl px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <FaUser />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit User" : "Create User"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit
                ? "Update staff user details."
                : "Add staff users under your admin account."}
            </p>
          </div>
        </div>

        {loadingUser && isEdit ? (
          <p className="text-sm text-gray-500">Loading user...</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("userName")}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <FaUser />
                </span>
              </div>
              {errors.userName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.userName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("email")}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <MdEmail />
                </span>
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("mobileNumber")}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <FaPhone />
                </span>
              </div>
              {errors.mobileNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.mobileNumber.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password{" "}
                {isEdit && (
                  <span className="text-xs text-gray-400">
                    (leave blank to keep same)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("password")}
                />
                <span
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register("role")}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving
                  ? isEdit
                    ? "Updating..."
                    : "Saving..."
                  : isEdit
                  ? "Update User"
                  : "Create User"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserCreatePage;
