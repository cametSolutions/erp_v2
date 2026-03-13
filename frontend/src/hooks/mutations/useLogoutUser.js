import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { authService } from "@/api/services/auth.service";
import { logout, setInitialized } from "@/store/slices/authSlice";

export const useLogoutUser = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const logoutUser = async () => {
    try {
      setLoading(true);
      await authService.logout();
      dispatch(logout());
      dispatch(setInitialized(true));
      toast.success("You have been logged out");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Logout failed";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { logoutUser, loading };
};
