import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";

/**
 * Tela de troca de senha. Dois cenários:
 * 1. Usuário comum (engajado) acessando voluntariamente — exige `current_password`.
 * 2. Caretaker recém-convidado (must_change_password=true) — `current_password`
 *    é opcional; após troca, sessão é derrubada e ele loga com a senha nova.
 */
export default function ChangePassword() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const forced = !!user?.must_change_password;

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const valid =
    newPwd.length >= 8 &&
    newPwd === confirmPwd &&
    (forced || currentPwd.length > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError("Confira os campos: senha nova precisa ter mín. 8 caracteres e bater com a confirmação.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, string> = { new_password: newPwd };
      if (currentPwd) payload.current_password = currentPwd;
      await api.post("/auth/change-password/", payload);

      setSuccess(true);
      // backend já blacklistou todos os refresh tokens — fazemos logout local
      // e jogamos pra /login com mensagem
      setTimeout(() => {
        logout();
        navigate("/login", {
          replace: true,
          state: { notice: "Senha alterada com sucesso. Faça login novamente." },
        });
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        if (typeof d === "object") {
          const msgs = Object.entries(d)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("\n");
          setError(msgs);
        } else {
          setError(String(d));
        }
      } else {
        setError("Erro ao trocar a senha. Tente novamente.");
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
          <h1 className="mt-3 text-2xl font-extrabold text-gradient">
            {forced ? "Defina sua senha" : "Trocar senha"}
          </h1>
          {forced && (
            <p className="mt-2 text-sm text-gray-500">
              Olá, <b>{user?.full_name}</b>! Você foi convidado(a) por um familiar.
              Crie uma senha pessoal para continuar.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {!forced && (
            <PasswordInput
              placeholder="Senha atual"
              autoComplete="current-password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              required
            />
          )}
          <PasswordInput
            placeholder="Nova senha (mín. 8 caracteres)"
            autoComplete="new-password"
            minLength={8}
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
          <PasswordInput
            placeholder="Confirme a nova senha"
            autoComplete="new-password"
            minLength={8}
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />

          {newPwd && confirmPwd && newPwd !== confirmPwd && (
            <p className="text-xs text-red-600">As senhas não coincidem.</p>
          )}

          {error && (
            <p className="whitespace-pre-line rounded-md bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">
              ✓ Senha alterada! Redirecionando para o login…
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !valid || success}
            className="btn-primary mt-2"
          >
            {loading ? "Salvando…" : forced ? "Definir senha" : "Trocar senha"}
          </button>

          {!forced && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-center text-sm text-gray-500 hover:text-brand-teal"
            >
              Cancelar
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
