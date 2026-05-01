import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, type UserRole } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TutorDashboard from "./pages/TutorDashboard";
import VetEntry from "./pages/VetEntry";
import ClinicalView from "./pages/ClinicalView";

function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: UserRole;
}) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  if (!token || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "TUTOR" ? "/tutor" : "/vet"} replace />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "TUTOR" ? "/tutor" : "/vet"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
