import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import PinInput from "../components/PinInput";
import RecentAccessList from "../components/RecentAccessList";

export default function VetDashboard() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePinSubmit = async (pin: string) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/access/claim/", { pin });
      setSession(data.access, pin);
      navigate(`/clinical/${pin}`);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 404
      ) {
        setError("PIN inválido ou expirado.");
      } else {
        setError("Erro ao validar PIN. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — Histórico recente */}
      <aside className="w-80 border-r border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          Acessos Recentes
        </h2>
        <RecentAccessList />
      </aside>

      {/* Área principal — PIN */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-700">
            PetDiary <span className="text-gray-400">Vet</span>
          </h1>
          <p className="mt-2 text-gray-500">
            Insira o PIN de 6 dígitos fornecido pelo tutor para acessar o
            prontuário do pet.
          </p>
        </div>

        <PinInput onSubmit={handlePinSubmit} loading={loading} />

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
