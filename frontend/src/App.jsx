import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { useDispatch } from "react-redux";

import { authService } from "./api/services/auth.service";
import RouteScrollReset from "./components/Layout/RouteScrollReset";
import CustomMoonLoader from "./components/Loaders/CustomMoonLoader";
import { appRoutes } from "./routes/appRoutes";
import { authRoutes } from "./routes/authRoutes";
import { ROUTES } from "./routes/paths";
import { masterRoutes } from "./routes/masterRoutes";
import { logout, setInitialized, setUser } from "./store/slices/authSlice";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      dispatch(setInitialized(false));

      try {
        const data = await authService.me();
        if (!isMounted) return;

        dispatch(setUser(data?.user ?? null));
      } catch {
        if (!isMounted) return;

        dispatch(logout());
      } finally {
        if (isMounted) {
          dispatch(setInitialized(true));
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return (
    <Suspense fallback={<CustomMoonLoader />}>
      <>
        <RouteScrollReset />
        <Routes>
          {authRoutes}
          {appRoutes}
          {masterRoutes}
          <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
