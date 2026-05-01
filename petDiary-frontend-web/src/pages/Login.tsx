import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import api from "../services/api";
import { useAuthStore, type AuthUser } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setKeepLogged = useAuthStore((s) => s.setKeepLogged);
  const initialKeepLogged = useAuthStore.getState().keepLogged;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepLogged, setKeepLoggedLocal] = useState(initialKeepLogged);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mensagem flash do redirecionamento (ex: vinda de /change-password)
  const notice = (location.state as { notice?: string } | null)?.notice;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Decide o storage ANTES do login para que o persist do Zustand
      // já escreva no lugar certo (localStorage vs sessionStorage)
      setKeepLogged(keepLogged);

      const { data: tokens } = await api.post<{
        access: string;
        refresh: string;
      }>("/auth/token/", { username, password });

      // busca perfil para descobrir o role
      const { data: user } = await axios.get<AuthUser>(
        `${api.defaults.baseURL}/users/me/`,
        { headers: { Authorization: `Bearer ${tokens.access}` } }
      );

      setAuth(tokens.access, tokens.refresh, user);

      // Caretaker recém-convidado → força tela de troca antes de qualquer coisa
      if (user.must_change_password) {
        navigate("/change-password", { replace: true });
        return;
      }

      if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }

      navigate(user.role === "TUTOR" ? "/tutor" : "/vet", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError(t("auth.errors.invalid_credentials"));
      } else {
        setError(t("auth.errors.generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md card">
        <div className="mb-8 text-center">
          <img src="/logo-192.png" alt="PetDiary" className="mx-auto h-20 w-20" />
          <h1 className="mt-4 text-3xl font-extrabold text-gradient">{t("auth.login.title")}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("auth.login.subtitle")}
          </p>
        </div>

        {notice && (
          <p className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">
            ✓ {notice}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder={t("auth.login.username")}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-teal focus:outline-none"
          />
          <PasswordInput
            placeholder={t("auth.login.password")}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="-mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-brand-teal hover:underline"
            >
              {t("auth.login.forgot_link")}
            </Link>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={keepLogged}
              onChange={(e) => setKeepLoggedLocal(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-brand-teal"
            />
            {t("auth.login.keep_logged")}
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="btn-primary"
          >
            {loading ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>

          {!keepLogged && (
            <p className="text-center text-xs text-gray-400">
              {t("auth.login.session_warning")}
            </p>
          )}

          <p className="mt-2 text-center text-sm text-gray-500">
            {t("auth.login.no_account")}{" "}
            <Link to="/register" className="font-semibold text-brand-teal hover:underline">
              {t("auth.login.register_link")}
            </Link>
          </p>
        </form>

        <details className="mt-6 rounded-md bg-gray-50 p-3 text-xs text-gray-500">
          <summary className="cursor-pointer">Contas de teste</summary>
          <p className="mt-2"><b>Tutor:</b> ana / ana123456</p>
          <p><b>Vet:</b> dra-camila / vet123456</p>
        </details>
      </div>
    </div>
  );
}
