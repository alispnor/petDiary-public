import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore, type UserRole } from "./store/authStore";
import { registerWebPush } from "./services/notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TutorDashboard from "./pages/TutorDashboard";
import VetEntry from "./pages/VetEntry";
import ClinicalView from "./pages/ClinicalView";
import AccountSettings from "./pages/AccountSettings";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminTickets from "./pages/admin/AdminTickets";
import Notifications from "./pages/Notifications";
import ErrorBoundary from "./components/ErrorBoundary";

function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: UserRole;
}) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token || !user) return <Navigate to="/login" replace />;

  // Caretaker recém-convidado precisa trocar senha antes de qualquer coisa.
  // Permite acesso à própria tela de troca para evitar loop.
  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (role && user.role !== role) {
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to={user.role === "TUTOR" ? "/tutor" : "/vet"} replace />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <Navigate to="/change-password" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  return <Navigate to={user.role === "TUTOR" ? "/tutor" : "/vet"} replace />;
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!token || !user) return;
    // Tenta registrar web push silenciosamente. Se permission for "default",
    // o navegador vai pedir confirmação ao user; se "denied", retorna false.
    // O user também pode ativar manualmente em /conta → Notificações.
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        registerWebPush().catch(() => {});
      }
    }
  }, [token, user]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ChangePassword />
            </RequireAuth>
          }
        />

        <Route
          path="/tutor"
          element={
            <RequireAuth role="TUTOR">
              <TutorDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/vet"
          element={
            <RequireAuth role="VET">
              <VetEntry />
            </RequireAuth>
          }
        />

        <Route
          path="/clinical/:petId"
          element={
            <RequireAuth>
              <ClinicalView />
            </RequireAuth>
          }
        />

        <Route
          path="/conta"
          element={
            <RequireAuth>
              <AccountSettings />
            </RequireAuth>
          }
        />

        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Notifications />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAuth role="ADMIN">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="tickets" element={<AdminTickets />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
