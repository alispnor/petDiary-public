import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import { useAuthStore, type AuthUser } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setKeepLogged = useAuthStore((s) => s.setKeepLogged);
  const initialKeepLogged = useAuthStore.getState().keepLogged;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepLogged, setKeepLoggedLocal] = useState(initialKeepLogged);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      navigate(user.role === "TUTOR" ? "/tutor" : "/vet", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Usuário ou senha inválidos.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md card">
        <div className="mb-8 text-center">
          <img src="/logo-192.png" alt="PetDiary" className="mx-auto h-20 w-20" />
          <h1 className="mt-4 text-3xl font-extrabold text-gradient">PetDiary</h1>
          <p className="mt-2 text-sm text-gray-500">
            Acesse sua conta de tutor ou veterinário
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Usuário"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-teal focus:outline-none"
          />
          <PasswordInput
            placeholder="Senha"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={keepLogged}
              onChange={(e) => setKeepLoggedLocal(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-brand-teal"
            />
            Manter-me conectado neste dispositivo
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
            {loading ? "Entrando…" : "Entrar"}
          </button>

          {!keepLogged && (
            <p className="text-center text-xs text-gray-400">
              ⓘ Sua sessão será encerrada ao fechar o navegador
            </p>
          )}

          <p className="mt-2 text-center text-sm text-gray-500">
            Não tem conta?{" "}
            <Link to="/register" className="font-semibold text-brand-teal hover:underline">
              Cadastre-se
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
