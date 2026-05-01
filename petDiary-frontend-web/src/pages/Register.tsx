import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import { useAuthStore, type AuthUser, type UserRole } from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [role, setRole] = useState<UserRole>("TUTOR");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [crmv, setCrmv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register/", {
        username,
        email,
        password,
        full_name: fullName,
        role,
        crmv: role === "VET" ? crmv : "",
      });

      // login automático após registro
      const { data: tokens } = await api.post<{
        access: string;
        refresh: string;
      }>("/auth/token/", { username, password });

      const { data: user } = await axios.get<AuthUser>(
        `${api.defaults.baseURL}/users/me/`,
        { headers: { Authorization: `Bearer ${tokens.access}` } }
      );

      setAuth(tokens.access, tokens.refresh, user);
      navigate(user.role === "TUTOR" ? "/tutor" : "/vet", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Erro ao cadastrar. Verifique os dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md card">
        <div className="mb-6 text-center">
          <img src="/logo-192.png" alt="PetDiary" className="mx-auto h-16 w-16" />
          <h1 className="mt-3 text-2xl font-extrabold text-gradient">Crie sua conta</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("TUTOR")}
              className={`flex-1 rounded-pill py-2 text-sm font-semibold transition ${
                role === "TUTOR"
                  ? "bg-brand-teal text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              🐾 Tutor
            </button>
            <button
              type="button"
              onClick={() => setRole("VET")}
              className={`flex-1 rounded-pill py-2 text-sm font-semibold transition ${
                role === "VET"
                  ? "bg-brand-orange text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              🩺 Veterinário
            </button>
          </div>

          <input
            type="text"
            placeholder="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
          />
          <input
            type="text"
            placeholder="Nome de usuário"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
          />
          <input
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
          />
          <input
            type="password"
            placeholder="Senha (mín. 8 caracteres)"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
          />
          {role === "VET" && (
            <input
              type="text"
              placeholder="CRMV (ex: SP-12345)"
              value={crmv}
              onChange={(e) => setCrmv(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
            />
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-2 text-xs text-red-600 break-words">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Cadastrando…" : "Criar conta"}
          </button>

          <p className="mt-1 text-center text-sm text-gray-500">
            Já tem conta?{" "}
            <Link to="/login" className="font-semibold text-brand-teal hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
