import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore, type UserRole } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChangePassword from "./pages/ChangePassword";
import TutorDashboard from "./pages/TutorDashboard";
import VetEntry from "./pages/VetEntry";
import ClinicalView from "./pages/ClinicalView";
import AccountSettings from "./pages/AccountSettings";

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
    return <Navigate to={user.role === "TUTOR" ? "/tutor" : "/vet"} replace />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <Navigate to="/change-password" replace />;
  return <Navigate to={user.role === "TUTOR" ? "/tutor" : "/vet"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
