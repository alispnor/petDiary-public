import { useState, type FormEvent } from "react";
import axios from "axios";
import api from "../services/api";
import { maskPhone, maskCPF, maskCEP, unmask } from "../utils/masks";
import { searchAddressByZip } from "../services/viaCep";
import { checkUsername } from "../services/usernameCheck";
import PasswordInput from "./PasswordInput";
import type { InviteMemberPayload, PetMember } from "../types";

interface Props {
  petId: string;
  petName: string;
  onClose: () => void;
  onInvited: (member: PetMember, credentials: { username: string; password: string }) => void;
}

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "too_short";

export default function InviteMemberModal({ petId, petName, onClose, onInvited }: Props) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [document, setDocument] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const [showAddress, setShowAddress] = useState(false);
  const [zip, setZip] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipLoading, setZipLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUsernameChange = async (val: string) => {
    const clean = val.replace(/\s+/g, "").toLowerCase();
    setUsername(clean);
    if (!clean) return setUsernameStatus("idle");
    if (clean.length < 3) return setUsernameStatus("too_short");
    setUsernameStatus("checking");
    const r = await checkUsername(clean);
    setUsernameStatus(r.available ? "available" : "taken");
  };

  const handleSearchZip = async () => {
    if (unmask(zip).length !== 8) return;
    setZipLoading(true);
    try {
      const a = await searchAddressByZip(zip);
      if (a) {
        setStreet(a.street);
        setDistrict(a.district);
        setCity(a.city);
        setState(a.state);
      }
    } finally {
      setZipLoading(false);
    }
  };

  const valid =
    !!fullName.trim() &&
    username.length >= 3 &&
    usernameStatus !== "taken" &&
    email.includes("@") &&
    !!phone.trim() &&
    tempPassword.length >= 8;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError("Confira os campos obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: InviteMemberPayload = {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        phone,
        whatsapp,
        temporary_password: tempPassword,
      };
      if (document) payload.document = document;
      if (showAddress) {
        payload.address_zip = zip;
        payload.address_street = street;
        payload.address_number = number;
        payload.address_complement = complement;
        payload.address_district = district;
        payload.address_city = city;
        payload.address_state = state;
      }

      const { data } = await api.post<PetMember>(`/pets/${petId}/members/`, payload);
      onInvited(data, { username: payload.username, password: payload.temporary_password });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        if (typeof d === "object") {
          setError(
            Object.entries(d)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join("\n")
          );
        } else {
          setError(String(d));
        }
      } else {
        setError("Erro ao convidar familiar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/15 text-2xl">
            👨‍👩‍👧
          </div>
          <h2 className="text-xl font-bold text-gray-800">Convidar familiar</h2>
          <p className="mt-1 text-sm text-gray-500">
            Adicione alguém da família para acessar o prontuário do <b>{petName}</b>.
            A pessoa troca a senha no primeiro acesso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nome completo *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="md:col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
          />

          <div>
            <input
              type="text"
              placeholder="Nome de usuário *"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              required
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none ${
                usernameStatus === "taken" ? "border-red-400" :
                usernameStatus === "available" ? "border-green-400" :
                "border-gray-300 focus:border-brand-teal"
              }`}
            />
            <div className="mt-1 px-1 text-xs">
              {usernameStatus === "checking" && <span className="text-gray-400">verificando…</span>}
              {usernameStatus === "available" && <span className="text-green-600">✓ disponível</span>}
              {usernameStatus === "taken" && <span className="text-red-600">✗ já em uso</span>}
              {usernameStatus === "too_short" && <span className="text-amber-600">mínimo 3 caracteres</span>}
            </div>
          </div>

          <input
            type="email"
            placeholder="E-mail *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Telefone/celular *"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            required
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
          />
          <input
            type="text"
            placeholder="CPF (opcional)"
            value={document}
            onChange={(e) => setDocument(maskCPF(e.target.value))}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
          />

          <PasswordInput
            placeholder="Senha temporária (mín. 8) *"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            minLength={8}
            required
          />

          <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={whatsapp}
              onChange={(e) => setWhatsapp(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-brand-teal"
            />
            Este número aceita mensagens via WhatsApp
          </label>

          <div className="md:col-span-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAddress(!showAddress)}
              className="text-sm text-brand-teal hover:underline"
            >
              {showAddress ? "− Ocultar endereço" : "+ Adicionar endereço (opcional)"}
            </button>
          </div>

          {showAddress && (
            <div className="md:col-span-2 flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CEP"
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
                  {zipLoading ? "buscando…" : "🔍 Buscar"}
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input type="text" placeholder="Rua/Logradouro" value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="md:col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
                <input type="text" placeholder="Número" value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input type="text" placeholder="Complemento" value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
                <input type="text" placeholder="Bairro" value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" placeholder="Cidade" value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-teal focus:outline-none" />
                  <select value={state} onChange={(e) => setState(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-2.5 text-sm focus:border-brand-teal focus:outline-none">
                    <option value="">UF</option>
                    {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="md:col-span-2 whitespace-pre-line rounded-md bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="md:col-span-2 flex gap-3 pt-3">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 rounded-pill border-2 border-gray-300 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !valid} className="flex-1 btn-primary">
              {loading ? "Convidando…" : "Convidar familiar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
