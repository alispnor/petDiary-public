import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import PinInput from "../components/PinInput";
import AccessHistorySidebar from "../components/AccessHistorySidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import NotificationsBell from "../components/NotificationsBell";
import type { AccessHistory } from "../types";

export default function VetEntry() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setPin = useAuthStore((s) => s.setPin);
  const logout = useAuthStore((s) => s.logout);

  const [history, setHistory] = useState<AccessHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get<AccessHistory[]>("/access/history/");
      setHistory(data);
    } catch {
      // não bloqueia a tela; vet ainda pode digitar PIN
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handlePinSubmit = async (pin: string) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post<{ pet: string }>("/access/claim/", {
        access_code: pin,
      });
      setPin(pin);
      // refresh do histórico antes de navegar (volta deste pet aparece atualizada)
      await loadHistory();
      navigate(`/clinical/${data.pet}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError(t("vet.errors.invalid_pin"));
      } else {
        setError(t("vet.errors.generic"));
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
    <div className="flex min-h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo-192.png" alt="PetDiary" className="h-8 w-8" />
          <h1 className="text-lg font-bold text-gradient">PetDiary</h1>
          <span className="rounded-full bg-brand-orange/15 px-3 py-0.5 text-xs font-semibold text-brand-orange">
            {t("vet.header_role")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user?.full_name}
            {user?.crmv ? ` · ${user.crmv}` : ""}
            {user?.clinic_name ? ` · ${user.clinic_name}` : ""}
          </span>
          <LanguageSwitcher />
          <NotificationsBell />
          <Link
            to="/conta"
            className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            ⚙️
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            {t("common.logout")}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AccessHistorySidebar items={history} loading={historyLoading} />

        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-12 overflow-y-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">
              {t("vet.title")}
            </h2>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              {t("vet.subtitle")}
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
    </div>
  );
}
