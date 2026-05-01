import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import api from "../services/api";
import { useAuthStore, type AuthUser, type UserRole } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { maskCPF, maskPhone, maskCEP, unmask } from "../utils/masks";
import { searchAddressByZip } from "../services/viaCep";
import { checkUsername } from "../services/usernameCheck";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "too_short";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [role, setRole] = useState<UserRole>("TUTOR");

  // identidade
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [document, setDocument] = useState("");

  // contato
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);

  // vet
  const [crmv, setCrmv] = useState("");
  const [clinicName, setClinicName] = useState("");

  // endereço
  const [zip, setZip] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // submit
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============ Username availability (debounced) ============
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!username.trim()) {
      setUsernameStatus("idle");
      return;
    }
    if (username.length < 3) {
      setUsernameStatus("too_short");
      return;
    }
    setUsernameStatus("checking");
    debounceRef.current = window.setTimeout(async () => {
      const r = await checkUsername(username.trim().toLowerCase());
      setUsernameStatus(r.available ? "available" : "taken");
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [username]);

  // ============ ViaCEP ============
  const handleSearchZip = async () => {
    if (unmask(zip).length !== 8) {
      setError("CEP inválido (precisa de 8 dígitos).");
      return;
    }
    setZipLoading(true);
    setError("");
    try {
      const a = await searchAddressByZip(zip);
      if (!a) {
        setError("CEP não encontrado.");
        return;
      }
      setStreet(a.street);
      setDistrict(a.district);
      setCity(a.city);
      setState(a.state);
    } finally {
      setZipLoading(false);
    }
  };

  // ============ Submit ============
  const formValid =
    fullName.trim() &&
    username.length >= 3 &&
    usernameStatus !== "taken" &&
    email.includes("@") &&
    password.length >= 8 &&
    phone.trim() &&
    (role === "TUTOR" || (crmv.trim() && clinicName.trim()));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formValid) {
      setError(t("auth.errors.fields_required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register/", {
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        phone,
        whatsapp,
        document,
        crmv: role === "VET" ? crmv : "",
        clinic_name: role === "VET" ? clinicName : "",
        address_zip: zip,
        address_street: street,
        address_number: number,
        address_complement: complement,
        address_district: district,
        address_city: city,
        address_state: state,
      });

      // login automático
      const { data: tokens } = await api.post<{ access: string; refresh: string }>(
        "/auth/token/",
        { username: username.trim().toLowerCase(), password }
      );
      const { data: user } = await axios.get<AuthUser>(
        `${api.defaults.baseURL}/users/me/`,
        { headers: { Authorization: `Bearer ${tokens.access}` } }
      );
      setAuth(tokens.access, tokens.refresh, user);
      navigate(user.role === "TUTOR" ? "/tutor" : "/vet", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        if (typeof d === "object") {
          const messages = Object.entries(d)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("\n");
          setError(messages);
        } else {
          setError(String(d));
        }
      } else {
        setError(t("auth.errors.register_generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  const usernameHint = (() => {
    switch (usernameStatus) {
      case "checking": return <span className="text-xs text-gray-400">{t("username_check.checking")}</span>;
      case "available": return <span className="text-xs text-green-600">{t("username_check.available")}</span>;
      case "taken": return <span className="text-xs text-red-600">{t("username_check.taken")}</span>;
      case "too_short": return <span className="text-xs text-amber-600">{t("username_check.too_short")}</span>;
      default: return null;
    }
  })();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-3xl card">
        <div className="mb-6 text-center">
          <img src="/logo-192.png" alt="PetDiary" className="mx-auto h-16 w-16" />
          <h1 className="mt-3 text-2xl font-extrabold text-gradient">{t("auth.register.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("auth.register.subtitle")}
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setRole("TUTOR")}
            className={`flex-1 rounded-pill py-2 text-sm font-semibold transition ${
              role === "TUTOR" ? "bg-brand-teal text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t("auth.register.as_tutor")}
          </button>
          <button
            type="button"
            onClick={() => setRole("VET")}
            className={`flex-1 rounded-pill py-2 text-sm font-semibold transition ${
              role === "VET" ? "bg-brand-orange text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t("auth.register.as_vet")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {/* ===================== COLUNA 1: identidade ===================== */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider">
              {t("auth.register.identity")}
            </h3>
            <input
              type="text"
              placeholder={`${t("fields.full_name")} *`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
            />

            <div>
              <input
                type="text"
                placeholder={`${t("fields.username")} *`}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
                required
                className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none ${
                  usernameStatus === "taken" ? "border-red-400" :
                  usernameStatus === "available" ? "border-green-400" :
                  "border-gray-300 focus:border-brand-teal"
                }`}
              />
              <div className="mt-1 px-1">{usernameHint}</div>
            </div>

            <input
              type="email"
              placeholder={`${t("fields.email")} *`}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
            />

            <PasswordInput
              placeholder={`${t("fields.password_min")} *`}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {role === "TUTOR" && (
              <input
                type="text"
                placeholder={t("fields.document_optional")}
                value={document}
                onChange={(e) => setDocument(maskCPF(e.target.value))}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
              />
            )}

            {role === "VET" && (
              <>
                <input
                  type="text"
                  placeholder={`${t("fields.crmv")} *`}
                  value={crmv}
                  onChange={(e) => setCrmv(e.target.value.toUpperCase())}
                  required
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={`${t("fields.clinic_name")} *`}
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
                />
              </>
            )}
          </div>

          {/* ===================== COLUNA 2: contato ===================== */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider">
              {t("auth.register.contact")}
            </h3>
            <input
              type="tel"
              placeholder={`${t("fields.phone")} *`}
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              required
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={whatsapp}
                onChange={(e) => setWhatsapp(e.target.checked)}
                className="h-4 w-4 accent-brand-teal"
              />
              {t("fields.whatsapp_label")}
            </label>
          </div>

          {/* ===================== ENDEREÇO (linha cheia) ===================== */}
          <div className="md:col-span-2 mt-2 flex flex-col gap-3 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider">
              {t("auth.register.address")}
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t("fields.zip")}
                value={zip}
                onChange={(e) => setZip(maskCEP(e.target.value))}
                maxLength={9}
                className="w-40 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearchZip}
                disabled={zipLoading || unmask(zip).length !== 8}
                className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {zipLoading ? t("fields.searching") : `🔍 ${t("fields.search_zip")}`}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                placeholder={t("fields.street")}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="md:col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
              />
              <input
                type="text"
                placeholder={t("fields.number")}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                placeholder={t("fields.complement")}
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
              />
              <input
                type="text"
                placeholder={t("fields.district")}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder={t("fields.city")}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
                />
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
                >
                  <option value="">{t("fields.uf")}</option>
                  {UF_LIST.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <p className="md:col-span-2 whitespace-pre-line rounded-md bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !formValid}
            className="md:col-span-2 btn-primary mt-2"
          >
            {loading ? t("auth.register.submitting") : t("auth.register.submit")}
          </button>

          <p className="md:col-span-2 mt-1 text-center text-sm text-gray-500">
            {t("auth.register.already_have")}{" "}
            <Link to="/login" className="font-semibold text-brand-teal hover:underline">
              {t("auth.register.login_link")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
