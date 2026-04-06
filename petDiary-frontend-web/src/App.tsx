import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VetDashboard from "./pages/VetDashboard";
import ClinicalView from "./pages/ClinicalView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VetDashboard />} />
        <Route path="/clinical/:pin" element={<ClinicalView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
