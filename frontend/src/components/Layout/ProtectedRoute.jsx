import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import CustomMoonLoader from "@/components/Loaders/CustomMoonLoader";
import { ROUTES } from "@/routes/paths";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isInitialized, user } = useSelector((state) => state.auth);

  if (!isInitialized) {
    return <CustomMoonLoader />;
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // If allowedRoles is given, restrict by role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return children;
}
