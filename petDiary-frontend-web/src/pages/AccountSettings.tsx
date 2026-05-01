import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import { useAuthStore, type AuthUser } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";
import LanguageSwitcher from "../components/LanguageSwitcher";
import MembersSection from "../components/MembersSection";
import { maskCPF, maskPhone, maskCEP, unmask } from "../utils/masks";
import { searchAddressByZip } from "../services/viaCep";
import { registerWebPush } from "../services/notifications";
import type { Pet, Subscription, NotificationPreferences } from "../types";

type Tab = "profile" | "family" | "subscription" | "notifications" | "security";

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
  const { t } = useTranslation();
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
            {t("clinical_extra.back")}
          </button>
          <h1 className="text-lg font-bold text-gradient">⚙️ {t("account.title")}</h1>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex gap-1 border-b border-gray-200 flex-wrap">
          <TabBtn active={tab === "profile"} onClick={() => setTab("profile")}>
            {t("account.tabs.profile")}
          </TabBtn>
          {user?.role === "TUTOR" && (
            <TabBtn active={tab === "family"} onClick={() => setTab("family")}>
              {t("account.tabs.family")}
            </TabBtn>
          )}
          <TabBtn active={tab === "subscription"} onClick={() => setTab("subscription")}>
            {t("account.tabs.subscription")}
          </TabBtn>
          <TabBtn active={tab === "notifications"} onClick={() => setTab("notifications")}>
            🔔 {t("account.tabs.notifications", "Notificações")}
          </TabBtn>
          <TabBtn active={tab === "security"} onClick={() => setTab("security")}>
            {t("account.tabs.security")}
          </TabBtn>
        </div>

        {tab === "profile" && user && (
          <ProfileTab user={user} setUser={setUser} />
        )}
        {tab === "family" && user && <FamilyTab currentUserId={user.id} />}
        {tab === "subscription" && <SubscriptionTab />}
        {tab === "notifications" && <NotificationsTab />}
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
  const { t } = useTranslation();
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
        setError(t("account.profile.error"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">{t("account.profile.title")}</h2>

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

      <h2 className="mt-2 text-lg font-bold text-gray-800">{t("account.profile.address_title")}</h2>

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
      {success && <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{t("account.profile.success")}</p>}

      <button type="submit" disabled={saving} className="btn-primary mt-2 self-start px-8">
        {saving ? t("account.profile.saving") : t("account.profile.save")}
      </button>
    </form>
  );
}

// =================================================
// FAMILIARES (todos os pets do user)
// =================================================

function FamilyTab({ currentUserId }: { currentUserId: string }) {
  const { t } = useTranslation();
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
        {t("account.family.no_pets")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card bg-brand-teal/5 border-l-4 border-brand-teal">
        <h2 className="font-bold text-gray-800">{t("account.tabs.family")} com acesso aos seus pets</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t("account.family.subtitle")}
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
  const { t } = useTranslation();
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
  if (!sub) return <p className="text-center text-gray-400">{t("account.subscription.not_found")}</p>;

  const isPro = sub.is_pro_active;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{t("account.subscription.title")}</h2>
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
            🚀 {t("account.subscription.subscribe")}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          {sub.current_period_end && (
            <p className="mb-4 text-sm text-gray-600">
              {t("account.subscription.next_billing")}: <b>{new Date(sub.current_period_end).toLocaleDateString("pt-BR")}</b>
            </p>
          )}
          {!sub.cancel_at_period_end && (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="rounded-pill border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              {t("account.subscription.cancel")}
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
              {t("account.subscription.cancel")}?
            </h2>
            <p className="mb-2 text-center text-sm text-gray-600">
              {t("account.subscription.confirm_cancel_text")}
            </p>
            <p className="mb-6 text-center text-xs text-gray-400">
              {t("account.subscription.confirm_cancel_note")}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmCancel(false)} disabled={canceling}
                className="flex-1 rounded-pill border-2 border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                {t("account.subscription.go_back")}
              </button>
              <button type="button" onClick={handleCancel} disabled={canceling}
                className="flex-1 rounded-pill bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {canceling ? t("account.subscription.canceling") : t("account.subscription.confirm_btn")}
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  // Step 0 = nada · 1 = primeiro aviso · 2 = digitar EXCLUIR + senha
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "EXCLUIR") {
      setError(t("account.security.error_type_excluir"));
      return;
    }
    if (!password) {
      setError(t("account.security.error_no_password"));
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
        setError(t("account.security.error_password"));
      } else {
        setError(t("account.security.error_delete"));
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card flex flex-col gap-6">
      {/* Trocar senha */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-lg font-bold text-gray-800">{t("account.security.change_password_title")}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("account.security.change_password_text")}
        </p>
        <button
          type="button"
          onClick={() => navigate("/change-password")}
          className="mt-4 rounded-pill border-2 border-brand-teal px-6 py-2 text-sm font-semibold text-brand-teal hover:bg-brand-teal hover:text-white"
        >
          🔑 {t("account.security.change_password_btn")}
        </button>
      </div>

      {/* Excluir conta */}
      <div>
        <h2 className="text-lg font-bold text-red-600">{t("account.security.delete_title")}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("account.security.delete_subtitle")}
        </p>

        {step === 0 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-4 rounded-pill border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            🗑 {t("account.security.delete_title")}
          </button>
        )}

        {step === 1 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-bold text-red-800">{t("account.security.warn_title")}</h3>
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
                {t("account.security.continue")}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 p-4">
            <h3 className="font-bold text-red-800">{t("account.security.final_title")}</h3>
            <p className="mt-2 text-sm text-gray-700">
              {t("account.security.final_text")}
            </p>
            <input
              type="text"
              placeholder={t("account.security.type_excluir")}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase tracking-wider focus:border-red-500 focus:outline-none"
            />
            <PasswordInput
              placeholder={t("account.security.your_password")}
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
                {deleting ? t("account.security.deleting") : `🗑 ${t("account.security.delete_definitively")}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// NotificationsTab — preferências por tipo + botão ativar push
// =====================================================

const PREF_ROWS: {
  key: keyof NotificationPreferences;
  icon: string;
  label: string;
  hint: string;
}[] = [
  {
    key: "push_vaccine",
    icon: "💉",
    label: "Vacinação",
    hint: "Lembretes de vacinas próximas ou em atraso",
  },
  {
    key: "push_vet_return",
    icon: "🏥",
    label: "Retorno ao veterinário",
    hint: "Lembretes de consultas marcadas",
  },
  {
    key: "push_payment_due",
    icon: "💳",
    label: "Vencimento de pagamento",
    hint: "Aviso 3 dias antes da renovação PRO",
  },
  {
    key: "push_payment_ok",
    icon: "✅",
    label: "Pagamento confirmado",
    hint: "Recibo quando o PIX cair",
  },
  {
    key: "push_pin_generated",
    icon: "🔑",
    label: "PIN criado",
    hint: "Confirmação após gerar PIN para o vet",
  },
  {
    key: "push_vet_access_claimed",
    icon: "🩺",
    label: "Vet acessou prontuário",
    hint: "Quando o vet usa o PIN para abrir os dados",
  },
  {
    key: "push_system",
    icon: "📢",
    label: "Avisos do sistema",
    hint: "Manutenções, novidades e mudanças importantes",
  },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data } = await api.get<NotificationPreferences>(
          "/notifications/preferences/"
        );
        if (!cancel) setPrefs(data);
      } catch {
        // ignora
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const handleToggle = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await api.put("/notifications/preferences/", next);
    } catch {
      setPrefs(prefs);
      alert("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnableBrowserPush = async () => {
    setActivating(true);
    const ok = await registerWebPush();
    setActivating(false);
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    if (!ok) {
      alert(
        "Não foi possível ativar push neste navegador. Verifique se as notificações estão liberadas nas configurações do site."
      );
    } else {
      alert("✓ Notificações ativadas neste navegador.");
    }
  };

  if (loading || !prefs) {
    return <p className="py-12 text-center text-gray-400">Carregando…</p>;
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-bold text-gray-700">
        🔔 Preferências de notificação
      </h2>

      <div className="divide-y divide-gray-100">
        {PREF_ROWS.map((row) => (
          <label
            key={row.key}
            className="flex cursor-pointer items-center justify-between gap-3 py-3"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{row.icon}</span>
              <div>
                <p className="font-semibold text-gray-700">{row.label}</p>
                <p className="text-xs text-gray-500">{row.hint}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!prefs[row.key]}
              onChange={(e) => handleToggle(row.key, e.target.checked)}
              disabled={saving}
              className="h-5 w-9 cursor-pointer accent-brand-teal"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-700">Permissão do navegador</h3>
        {permission === "unsupported" && (
          <p className="mt-1 text-sm text-gray-500">
            Seu navegador não suporta notificações push.
          </p>
        )}
        {permission === "denied" && (
          <p className="mt-1 text-sm text-red-600">
            Notificações bloqueadas. Você precisa liberar nas configurações do
            navegador (cadeado na barra de endereço → Notificações).
          </p>
        )}
        {permission === "granted" && (
          <p className="mt-1 text-sm text-green-700">
            ✓ Notificações permitidas neste navegador.
          </p>
        )}
        {permission === "default" && (
          <>
            <p className="mt-1 text-sm text-gray-500">
              Toque para receber notificações neste navegador mesmo com a aba
              fechada.
            </p>
            <button
              onClick={handleEnableBrowserPush}
              disabled={activating}
              className="mt-3 rounded-pill bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {activating ? "Ativando…" : "Ativar notificações no navegador"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
