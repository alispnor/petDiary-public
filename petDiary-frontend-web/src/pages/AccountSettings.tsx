import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import { useAuthStore, type AuthUser } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";
import LanguageSwitcher from "../components/LanguageSwitcher";
import MembersSection from "../components/MembersSection";
import { maskCPF, maskPhone, maskCEP, unmask } from "../utils/masks";
import { searchAddressByZip } from "../services/viaCep";
import type { Pet, Subscription } from "../types";

type Tab = "profile" | "family" | "subscription" | "security";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
  whatsapp: boolean;
  document: string;
  crmv: string;
  clinic_name: string;
  address_zip: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_city: string;
  address_state: string;
}

function loadFromUser(u: AuthUser | null): ProfileForm {
  return {
    full_name: u?.full_name ?? "",
    email: u?.email ?? "",
    phone: (u as any)?.phone ?? "",
    whatsapp: (u as any)?.whatsapp ?? false,
    document: (u as any)?.document ?? "",
    crmv: u?.crmv ?? "",
    clinic_name: u?.clinic_name ?? "",
    address_zip: (u as any)?.address_zip ?? "",
    address_street: (u as any)?.address_street ?? "",
    address_number: (u as any)?.address_number ?? "",
    address_complement: (u as any)?.address_complement ?? "",
    address_district: (u as any)?.address_district ?? "",
    address_city: (u as any)?.address_city ?? "",
    address_state: (u as any)?.address_state ?? "",
  };
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
          >
            ← Voltar
          </button>
          <h1 className="text-lg font-bold text-gradient">⚙️ Minha Conta</h1>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex gap-1 border-b border-gray-200 flex-wrap">
          <TabBtn active={tab === "profile"} onClick={() => setTab("profile")}>
            👤 Perfil
          </TabBtn>
          {user?.role === "TUTOR" && (
            <TabBtn active={tab === "family"} onClick={() => setTab("family")}>
              👨‍👩‍👧 Familiares
            </TabBtn>
          )}
          <TabBtn active={tab === "subscription"} onClick={() => setTab("subscription")}>
            💳 Assinatura
          </TabBtn>
          <TabBtn active={tab === "security"} onClick={() => setTab("security")}>
            🔐 Segurança
          </TabBtn>
        </div>

        {tab === "profile" && user && (
          <ProfileTab user={user} setUser={setUser} />
        )}
        {tab === "family" && user && <FamilyTab currentUserId={user.id} />}
        {tab === "subscription" && <SubscriptionTab />}
        {tab === "security" && (
          <SecurityTab onAfterDelete={() => { logout(); navigate("/login", { replace: true }); }} />
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold transition border-b-2 ${
        active
          ? "border-brand-teal text-brand-teal"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

// =================================================
// PERFIL
// =================================================

function ProfileTab({ user, setUser }: { user: AuthUser; setUser: (u: AuthUser) => void }) {
  const [form, setForm] = useState<ProfileForm>(loadFromUser(user));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [zipLoading, setZipLoading] = useState(false);

  const upd = (k: keyof ProfileForm, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSearchZip = async () => {
    if (unmask(form.address_zip).length !== 8) return;
    setZipLoading(true);
    try {
      const a = await searchAddressByZip(form.address_zip);
      if (a) {
        setForm((p) => ({
          ...p,
          address_street: a.street,
          address_district: a.district,
          address_city: a.city,
          address_state: a.state,
        }));
      }
    } finally {
      setZipLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const { data } = await api.put<AuthUser>("/users/me/", form);
      setUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        if (typeof d === "object") {
          setError(Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n"));
        } else {
          setError(String(d));
        }
      } else {
        setError("Erro ao salvar.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">Dados pessoais</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <input type="text" placeholder="Nome completo *" value={form.full_name}
          onChange={(e) => upd("full_name", e.target.value)} required
          className="md:col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />

        <input type="email" placeholder="E-mail *" value={form.email}
          onChange={(e) => upd("email", e.target.value)} required
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />

        <input type="tel" placeholder="Telefone *" value={form.phone}
          onChange={(e) => upd("phone", maskPhone(e.target.value))} required
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />

        {user.role === "TUTOR" && (
          <input type="text" placeholder="CPF (opcional)" value={form.document}
            onChange={(e) => upd("document", maskCPF(e.target.value))}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
        )}

        {user.role === "VET" && (
          <>
            <input type="text" placeholder="CRMV" value={form.crmv}
              onChange={(e) => upd("crmv", e.target.value.toUpperCase())}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
            <input type="text" placeholder="Nome da clínica" value={form.clinic_name}
              onChange={(e) => upd("clinic_name", e.target.value)}
              className="md:col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
          </>
        )}

        <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={form.whatsapp}
            onChange={(e) => upd("whatsapp", e.target.checked)}
            className="h-4 w-4 accent-brand-teal" />
          Este número aceita mensagens via WhatsApp
        </label>
      </div>

      <h2 className="mt-2 text-lg font-bold text-gray-800">Endereço</h2>

      <div className="flex gap-2">
        <input type="text" placeholder="CEP" value={form.address_zip}
          onChange={(e) => upd("address_zip", maskCEP(e.target.value))} maxLength={9}
          className="w-40 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
        <button type="button" onClick={handleSearchZip}
          disabled={zipLoading || unmask(form.address_zip).length !== 8}
          className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
          {zipLoading ? "buscando…" : "🔍 Buscar"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input type="text" placeholder="Rua" value={form.address_street}
          onChange={(e) => upd("address_street", e.target.value)}
          className="md:col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
        <input type="text" placeholder="Número" value={form.address_number}
          onChange={(e) => upd("address_number", e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
        <input type="text" placeholder="Complemento" value={form.address_complement}
          onChange={(e) => upd("address_complement", e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
        <input type="text" placeholder="Bairro" value={form.address_district}
          onChange={(e) => upd("address_district", e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
        <div className="grid grid-cols-3 gap-2">
          <input type="text" placeholder="Cidade" value={form.address_city}
            onChange={(e) => upd("address_city", e.target.value)}
            className="col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
          <select value={form.address_state}
            onChange={(e) => upd("address_state", e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-2.5 text-sm focus:border-brand-teal focus:outline-none">
            <option value="">UF</option>
            {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="whitespace-pre-line rounded-md bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>}
      {success && <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">✓ Dados atualizados com sucesso</p>}

      <button type="submit" disabled={saving} className="btn-primary mt-2 self-start px-8">
        {saving ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}

// =================================================
// FAMILIARES (todos os pets do user)
// =================================================

function FamilyTab({ currentUserId }: { currentUserId: string }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Pet[]>("/pets/")
      .then(({ data }) => setPets(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-gray-400">Carregando…</p>;

  if (pets.length === 0) {
    return (
      <div className="card text-center text-gray-500">
        Você não tem pets cadastrados ainda. Cadastre um pet para poder convidar familiares.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card bg-brand-teal/5 border-l-4 border-brand-teal">
        <h2 className="font-bold text-gray-800">👨‍👩‍👧 Familiares com acesso aos seus pets</h2>
        <p className="mt-2 text-sm text-gray-600">
          Adicione membros da família para que possam ver e adicionar registros aos prontuários.
        </p>
        <p className="mt-2 text-xs text-brand-teal font-medium">
          ✨ Familiares convidados <b>compartilham sua assinatura PRO</b> sem pagar separado.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Cada familiar terá login próprio e poderá ver/adicionar registros, mas <b>não</b> poderá gerar PIN nem revogar acessos vet.
        </p>
      </div>

      {pets.map((pet) => (
        <div key={pet.id} className="card">
          <h3 className="text-base font-bold text-gray-800">{pet.name}</h3>
          <p className="text-xs text-gray-500">
            {pet.breed || "—"}{pet.weight_kg ? ` · ${pet.weight_kg} kg` : ""}
          </p>
          <MembersSection
            petId={pet.id}
            petName={pet.name}
            currentUserId={currentUserId}
          />
        </div>
      ))}
    </div>
  );
}

// =================================================
// ASSINATURA
// =================================================

function SubscriptionTab() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [info, setInfo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Subscription>("/billing/subscription/");
      setSub(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubscribe = async () => {
    try {
      await api.post("/billing/subscribe/", {});
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setInfo(err.response.data.detail);
        setTimeout(() => setInfo(""), 5000);
      }
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const { data } = await api.post<Subscription>("/billing/cancel/", {});
      setSub(data);
      setConfirmCancel(false);
    } catch {
      setInfo("Erro ao cancelar assinatura.");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return <p className="text-center text-gray-400">Carregando…</p>;
  if (!sub) return <p className="text-center text-gray-400">Assinatura não encontrada.</p>;

  const isPro = sub.is_pro_active;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Plano atual</h2>
          <p className="mt-2 text-3xl font-extrabold text-gradient">
            {sub.plan_type === "PRO" ? "PRO 🎉" : "FREE"}
          </p>
          <p className="mt-1 text-sm text-gray-500">Status: {sub.status}</p>
          {sub.cancel_at_period_end && (
            <p className="mt-1 text-sm text-amber-600">
              ⚠ Cancelamento agendado para o fim do período pago
            </p>
          )}
        </div>
      </div>

      {info && (
        <p className="mt-4 rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-700">{info}</p>
      )}

      {!isPro ? (
        <div className="mt-6 rounded-lg border border-brand-orange/30 bg-brand-orange/5 p-4">
          <h3 className="font-bold text-brand-orange">PetDiary PRO</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>✅ OCR automático de receitas e exames</li>
            <li>✅ Transcrição de áudio (diário falado)</li>
            <li>✅ Resumo inteligente de prontuário</li>
            <li>✅ Storage ilimitado para anexos</li>
          </ul>
          <button
            type="button"
            onClick={handleSubscribe}
            className="mt-4 w-full rounded-pill bg-brand-orange py-3 text-sm font-bold text-white hover:opacity-90"
          >
            🚀 Assinar PRO
          </button>
        </div>
      ) : (
        <div className="mt-6">
          {sub.current_period_end && (
            <p className="mb-4 text-sm text-gray-600">
              Próxima cobrança: <b>{new Date(sub.current_period_end).toLocaleDateString("pt-BR")}</b>
            </p>
          )}
          {!sub.cancel_at_period_end && (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="rounded-pill border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      )}

      {/* Modal de confirmação de cancelamento */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
             onClick={() => !canceling && setConfirmCancel(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
               onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-center text-xl font-bold text-gray-800">
              Cancelar assinatura?
            </h2>
            <p className="mb-2 text-center text-sm text-gray-600">
              Você continuará com acesso PRO até o final do período já pago.
            </p>
            <p className="mb-6 text-center text-xs text-gray-400">
              ✓ Pode reativar a qualquer momento antes do vencimento.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmCancel(false)} disabled={canceling}
                className="flex-1 rounded-pill border-2 border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Voltar
              </button>
              <button type="button" onClick={handleCancel} disabled={canceling}
                className="flex-1 rounded-pill bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {canceling ? "Cancelando…" : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================
// SEGURANÇA
// =================================================

function SecurityTab({ onAfterDelete }: { onAfterDelete: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  // Step 0 = nada · 1 = primeiro aviso · 2 = digitar EXCLUIR + senha
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "EXCLUIR") {
      setError("Digite EXCLUIR para confirmar.");
      return;
    }
    if (!password) {
      setError("Informe sua senha.");
      return;
    }
    setDeleting(true);
    setError("");
    try {
      // Re-autentica pra confirmar a senha (segurança extra)
      const username = useAuthStore.getState().user?.username;
      await api.post("/auth/token/", { username, password });

      await api.delete("/users/me/", {
        headers: { "X-Confirm-Delete": "EXCLUIR" },
      });
      onAfterDelete();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Senha incorreta.");
      } else {
        setError("Erro ao excluir conta.");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card flex flex-col gap-6">
      {/* Trocar senha */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-lg font-bold text-gray-800">Alterar senha</h2>
        <p className="mt-1 text-sm text-gray-500">
          Você precisará informar sua senha atual.
        </p>
        <button
          type="button"
          onClick={() => navigate("/change-password")}
          className="mt-4 rounded-pill border-2 border-brand-teal px-6 py-2 text-sm font-semibold text-brand-teal hover:bg-brand-teal hover:text-white"
        >
          🔑 Trocar senha
        </button>
      </div>

      {/* Excluir conta */}
      <div>
        <h2 className="text-lg font-bold text-red-600">Excluir minha conta</h2>
        <p className="mt-1 text-sm text-gray-500">
          Esta ação anonimiza seus dados pessoais conforme a LGPD. <b>Não pode ser desfeita.</b>
        </p>

        {step === 0 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-4 rounded-pill border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            🗑 Excluir minha conta
          </button>
        )}

        {step === 1 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-bold text-red-800">⚠ Você tem certeza?</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>• Seu acesso será encerrado imediatamente</li>
              <li>• Seus dados pessoais serão anonimizados (LGPD)</li>
              <li>• Pets onde você é único tutor terão acesso transferido para um familiar (caretaker mais antigo)</li>
              <li>• Os registros clínicos dos pets <b>são preservados</b> para auditoria</li>
              <li>• Sua assinatura PRO (se houver) será cancelada</li>
              <li>• <b>Esta ação não pode ser desfeita</b></li>
            </ul>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setStep(0)}
                className="flex-1 rounded-pill border-2 border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 rounded-pill bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 p-4">
            <h3 className="font-bold text-red-800">Confirmação final</h3>
            <p className="mt-2 text-sm text-gray-700">
              Para confirmar, digite <b>EXCLUIR</b> e informe sua senha atual:
            </p>
            <input
              type="text"
              placeholder="Digite EXCLUIR"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase tracking-wider focus:border-red-500 focus:outline-none"
            />
            <PasswordInput
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3"
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => { setStep(0); setConfirmText(""); setPassword(""); setError(""); }}
                disabled={deleting}
                className="flex-1 rounded-pill border-2 border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={handleDelete}
                disabled={deleting || confirmText.trim().toUpperCase() !== "EXCLUIR" || !password}
                className="flex-1 rounded-pill bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Excluindo…" : "🗑 Excluir definitivamente"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
