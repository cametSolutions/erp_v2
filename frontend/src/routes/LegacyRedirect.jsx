import { Navigate, useLocation } from "react-router-dom";

export default function LegacyRedirect({ to }) {
  const location = useLocation();

  return <Navigate to={`${to}${location.search}`} replace />;
}
