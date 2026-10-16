import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteFallback } from "@/components/common/RouteFallback";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/RouteGuards";
import { useSession } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Market = lazy(() => import("@/pages/Market"));
const Suggestions = lazy(() => import("@/pages/Suggestions"));
const Screener = lazy(() => import("@/pages/Screener"));
const Compare = lazy(() => import("@/pages/Compare"));
const StockDetail = lazy(() => import("@/pages/StockDetail"));
const Watchlists = lazy(() => import("@/pages/Watchlists"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const PaperTrading = lazy(() => import("@/pages/PaperTrading"));
const News = lazy(() => import("@/pages/News"));
const Notes = lazy(() => import("@/pages/Notes"));
const Tools = lazy(() => import("@/pages/Tools"));
const Alerts = lazy(() => import("@/pages/Alerts"));
const SavedScreens = lazy(() => import("@/pages/SavedScreens"));
const Settings = lazy(() => import("@/pages/Settings"));
const Admin = lazy(() => import("@/pages/Admin"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export function App() {
  useTheme();
  useSession();
  const location = useLocation();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes location={location}>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/market" element={<Market />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/stocks/:symbol" element={<StockDetail />} />
            <Route path="/watchlists" element={<Watchlists />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/paper" element={<PaperTrading />} />
            <Route path="/news" element={<News />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/saved-screens" element={<SavedScreens />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
