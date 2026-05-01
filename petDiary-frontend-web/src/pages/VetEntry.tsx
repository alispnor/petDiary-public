import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import PinInput from "../components/PinInput";

export default function VetEntry() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setPin = useAuthStore((s) => s.setPin);
  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePinSubmit = async (pin: string) => {
    setLoading(true);
    setError("");
    try {
      // ⚠️ backend espera { access_code }, não { pin } (era bug #1)
      const { data } = await api.post<{ pet: string }>("/access/claim/", {
        access_code: pin,
      });
      setPin(pin);
      navigate(`/clinical/${data.pet}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("PIN inválido ou expirado.");
      } else {
        setError("Erro ao validar PIN. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo-192.png" alt="PetDiary" className="h-8 w-8" />
          <h1 className="text-lg font-bold text-gradient">PetDiary</h1>
          <span className="rounded-full bg-brand-orange/15 px-3 py-0.5 text-xs font-semibold text-brand-orange">
            Veterinário
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user?.full_name}
            {user?.crmv ? ` · ${user.crmv}` : ""}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center gap-6 px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            Insira o PIN do paciente
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            O tutor gerou um PIN de 6 dígitos no aplicativo. Digite abaixo para
            acessar o prontuário.
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
