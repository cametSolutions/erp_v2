import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import CustomMoonLoader from "@/components/Loaders/CustomMoonLoader";
import { ROUTES } from "@/routes/paths";

export default function PublicRoute({ children }) {
  const { isInitialized, user } = useSelector((state) => state.auth);

  if (!isInitialized) {
    return <CustomMoonLoader />;
  }

  if (user) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return children;
}
