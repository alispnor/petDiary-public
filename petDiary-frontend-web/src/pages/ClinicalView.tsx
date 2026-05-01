import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { HealthRecord, Pet, RecordType } from "../types";
import RevokedModal from "../components/RevokedModal";

const SPECIES_LABEL: Record<string, string> = {
  DOG: "Cachorro",
  CAT: "Gato",
  BIRD: "Pássaro",
  OTHER: "Outro",
};

const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  VACCINE: "💉 Vacina",
  EXAM: "🔬 Exame",
  PRESCRIPTION: "💊 Receita",
  SURGERY: "🏥 Cirurgia",
  NOTE: "📝 Nota",
};

export default function ClinicalView() {
  const navigate = useNavigate();
  const { petId } = useParams<{ petId: string }>();
  const user = useAuthStore((s) => s.user);
  const revoked = useAuthStore((s) => s.revoked);
  const clearRevoked = useAuthStore((s) => s.clearRevoked);
  const logout = useAuthStore((s) => s.logout);

  const [pet, setPet] = useState<Pet | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [recordType, setRecordType] = useState<RecordType>("NOTE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!petId) return;
    setLoading(true);
    setError("");
    try {
      const [petRes, recordsRes] = await Promise.all([
        api.get<Pet>(`/pets/${petId}/`),
        api.get<HealthRecord[]>(`/pets/${petId}/health-records/`),
      ]);
      setPet(petRes.data);
      setRecords(recordsRes.data);
    } catch {
      setError("Não foi possível carregar o prontuário.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const handleAddRecord = async (e: FormEvent) => {
    e.preventDefault();
    if (!petId) return;
    setSubmitting(true);
    try {
      await api.post(`/pets/${petId}/health-records/`, {
        record_type: recordType,
        title,
        description,
        date_occurred: date,
      });
      setTitle("");
      setDescription("");
      setRecordType("NOTE");
      await loadData();
    } catch {
      setError("Erro ao adicionar registro.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissRevoked = () => {
    clearRevoked();
    const home = user?.role === "TUTOR" ? "/tutor" : "/vet";
    navigate(home, { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleBack = () => {
    const home = user?.role === "TUTOR" ? "/tutor" : "/vet";
    navigate(home);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
          >
            ← Voltar
          </button>
          <h1 className="text-lg font-bold text-gradient">
            PetDiary <span className="text-gray-400 font-normal">Prontuário</span>
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          Sair
        </button>
      </header>

      {error && (
        <p className="mx-6 mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {loading || !pet ? (
            <p className="text-center text-gray-400">Carregando prontuário…</p>
          ) : (
            <>
              <div className="card mb-6 flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-teal/10 text-4xl">
                  {pet.species === "DOG"
                    ? "🐕"
                    : pet.species === "CAT"
                    ? "🐱"
                    : pet.species === "BIRD"
                    ? "🐦"
                    : "🐾"}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">{pet.name}</h2>
                  <p className="text-sm text-gray-500">
                    {SPECIES_LABEL[pet.species]} · {pet.breed || "raça —"}
                    {pet.weight_kg ? ` · ${pet.weight_kg} kg` : ""}
                  </p>
                </div>
              </div>

              <h3 className="mb-3 text-lg font-semibold text-gray-700">
                Histórico Clínico
              </h3>

              {records.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nenhum registro ainda. Adicione o primeiro à direita.
                </p>
              ) : (
                <ol className="relative border-l-2 border-brand-teal/30 pl-6">
                  {records.map((r) => (
                    <li key={r.id} className="mb-6">
                      <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-brand-teal" />
                      <div className="rounded-lg border-l-4 border-brand-teal bg-white p-4 shadow-sm">
                        <div className="mb-1 flex items-center justify-between">
                          <h4 className="font-semibold text-gray-800">
                            {RECORD_TYPE_LABEL[r.record_type]} · {r.title}
                          </h4>
                          <span className="text-xs text-gray-400">
                            {r.date_occurred}
                          </span>
                        </div>
                        {r.description && (
                          <p className="text-sm text-gray-600">{r.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>

        <aside className="w-96 border-l border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Adicionar registro
          </h3>
          <form onSubmit={handleAddRecord} className="flex flex-col gap-3">
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as RecordType)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-teal focus:outline-none"
            >
              {(
                ["NOTE", "VACCINE", "EXAM", "PRESCRIPTION", "SURGERY"] as RecordType[]
              ).map((t) => (
                <option key={t} value={t}>
                  {RECORD_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-teal focus:outline-none"
            />
            <textarea
              rows={5}
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-teal focus:outline-none"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-teal focus:outline-none"
            />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Salvando…" : "Adicionar"}
            </button>
          </form>
        </aside>
      </div>

      {revoked && <RevokedModal onDismiss={handleDismissRevoked} />}
    </div>
  );
}
