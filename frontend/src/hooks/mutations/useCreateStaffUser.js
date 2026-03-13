// src/hooks/users/useCreateStaffUser.js
import { useState } from "react";
import { toast } from "sonner";
import { userService } from "../../api/services/user.service";

export const useCreateStaffUser = () => {
  const [loading, setLoading] = useState(false);

  const createStaffUser = async (payload) => {
    try {
      setLoading(true);
      const data = await userService.createStaff(payload);
      toast.success(data.message || "User created successfully");
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "User creation failed";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createStaffUser, loading };
};
