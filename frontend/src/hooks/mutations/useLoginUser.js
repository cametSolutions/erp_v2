import { useState } from "react";
import { useDispatch } from "react-redux";
import { authService } from "../../api/services/auth.service";
import { toast } from "sonner";
import { setUser } from "../../store/slices/authSlice";
import { capitalizeFirstLetter } from "../../../../shared/utils/string";

export const useLoginUser = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const extractUser = (response) => {
    if (!response || typeof response !== "object") return null;

    return (
      response.user ||
      response.payload?.user ||
      response.payload ||
      response.data?.user ||
      response.data?.payload?.user ||
      response.data?.payload ||
      null
    );
  };

  const loginUser = async (payload) => {
    try {
      setLoading(true);
      const data = await authService.login(payload); // { identifier, password }

      const user = extractUser(data);
      if (user) {
        dispatch(setUser(user));
      }

      const displayName =
        user?.userName || user?.name || user?.email || "User";
      toast.success(`Welcome back, ${capitalizeFirstLetter(displayName)}`);
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Login failed";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loginUser, loading };
};
