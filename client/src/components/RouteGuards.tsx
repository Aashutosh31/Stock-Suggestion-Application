import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { RouteFallback } from "@/components/common/RouteFallback";

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "unknown") return <RouteFallback />;
  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === "unknown") return <RouteFallback />;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <Outlet />;
}
