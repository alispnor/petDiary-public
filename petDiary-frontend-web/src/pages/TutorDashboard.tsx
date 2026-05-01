import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { ActiveAccess, Pet, Species, VetAccessToken } from "../types";
import VetAccessSection from "../components/VetAccessSection";
import MembersSection from "../components/MembersSection";
import RemindersSection from "../components/RemindersSection";
import LanguageSwitcher from "../components/LanguageSwitcher";
import NotificationsBell from "../components/NotificationsBell";

// Lista usada apenas como fonte de keys; labels traduzidos via t() na render
const SPECIES_OPTIONS: { value: Species; emoji: string }[] = [
  { value: "DOG", emoji: "🐕" },
  { value: "CAT", emoji: "🐱" },
  { value: "BIRD", emoji: "🐦" },
  { value: "OTHER", emoji: "🐾" },
];

const SPECIES_EMOJI: Record<Species, string> = {
  DOG: "🐕",
  CAT: "🐱",
  BIRD: "🐦",
  OTHER: "🐾",
};

const SPECIES_LABEL_KEY: Record<Species, string> = {
  DOG: "Cachorro",
  CAT: "Gato",
  BIRD: "Pássaro",
  OTHER: "Outro",
};

export default function TutorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [pets, setPets] = useState<Pet[]>([]);
  const [accesses, setAccesses] = useState<ActiveAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("DOG");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");

  const [pinResult, setPinResult] = useState<VetAccessToken | null>(null);
  const [generatingPin, setGeneratingPin] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [petsRes, accRes] = await Promise.all([
        api.get<Pet[]>("/pets/"),
        api.get<ActiveAccess[]>("/access/active/"),
      ]);
      setPets(petsRes.data);
      setAccesses(accRes.data);
    } catch {
      setError(t("tutor.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  const refetchAccesses = async () => {
    try {
      const { data } = await api.get<ActiveAccess[]>("/access/active/");
      setAccesses(data);
    } catch {
      // silencia — não bloqueia a tela
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreatePet = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/pets/", {
        name,
        species,
        breed,
        weight_kg: weight ? Number(weight) : null,
      });
      setName("");
      setSpecies("DOG");
      setBreed("");
      setWeight("");
      setShowCreate(false);
      await loadAll();
    } catch {
      setError(t("tutor.errors.create_pet"));
    } finally {
      setCreating(false);
    }
  };

  const handleGeneratePin = async (petId: string) => {
    setGeneratingPin(petId);
    try {
      const { data } = await api.post<VetAccessToken>("/access/generate-pin/", {
        pet: petId,
      });
      setPinResult(data);
    } catch {
      setError(t("tutor.errors.generate_pin"));
    } finally {
      setGeneratingPin(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo-192.png" alt="PetDiary" className="h-8 w-8" />
          <h1 className="text-lg font-bold text-gradient">PetDiary</h1>
          <span className="rounded-full bg-brand-teal/10 px-3 py-0.5 text-xs font-semibold text-brand-teal">
            {t("tutor.header_role")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{t("tutor.greeting")}, {user?.full_name}</span>
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

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">{t("tutor.my_pets")}</h2>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
            {showCreate ? t("common.cancel") : t("tutor.new_pet")}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreatePet} className="card mb-6 flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-gray-700">{t("tutor.register_pet")}</h3>
            <input
              type="text"
              placeholder={t("tutor.pet_name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-teal focus:outline-none"
            />
            <div className="flex gap-2">
              {SPECIES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpecies(opt.value)}
                  className={`flex-1 rounded-lg py-2 text-sm transition ${
                    species === opt.value
                      ? "bg-brand-teal text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {opt.emoji} {SPECIES_LABEL_KEY[opt.value]}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder={t("tutor.breed")}
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-teal focus:outline-none"
            />
            <input
              type="number"
              step="0.1"
              placeholder={t("tutor.weight_kg")}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-teal focus:outline-none"
            />
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? t("tutor.saving") : t("tutor.register_btn")}
            </button>
          </form>
        )}

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-center text-gray-400">{t("common.loading")}</p>
        ) : pets.length === 0 ? (
          <div className="card text-center text-gray-500">
            {t("tutor.no_pets")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pets.map((pet) => (
              <div key={pet.id} className="card">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/10 text-3xl">
                    {SPECIES_EMOJI[pet.species]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{pet.name}</h3>
                    <p className="text-sm text-gray-500">
                      {pet.breed || "—"}
                      {pet.weight_kg ? ` · ${pet.weight_kg} kg` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/clinical/${pet.id}`}
                    className="w-full rounded-pill bg-brand-teal py-2 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {t("tutor.view_records")}
                  </Link>
                  <button
                    onClick={() => handleGeneratePin(pet.id)}
                    disabled={generatingPin === pet.id}
                    className="w-full rounded-pill border-2 border-brand-orange bg-white py-2 text-sm font-semibold text-brand-orange transition hover:bg-brand-orange hover:text-white disabled:opacity-50"
                  >
                    {generatingPin === pet.id ? t("tutor.generating") : t("tutor.generate_pin")}
                  </button>
                </div>

                <VetAccessSection
                  petId={pet.id}
                  accesses={accesses}
                  onRevoked={refetchAccesses}
                />

                <MembersSection
                  petId={pet.id}
                  petName={pet.name}
                  currentUserId={user?.id ?? ""}
                />

                <RemindersSection petId={pet.id} petName={pet.name} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal PIN gerado */}
      {pinResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setPinResult(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange/15 text-3xl">
              🔑
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">{t("pin_modal.title")}</h2>
            <p className="mb-4 text-sm text-gray-500">
              {t("pin_modal.subtitle")}
            </p>
            <div className="my-6 rounded-2xl bg-gray-100 py-6 text-center">
              <p className="font-mono text-5xl font-extrabold tracking-widest text-gradient">
                {pinResult.access_code}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pinResult.access_code);
                }}
                className="flex-1 rounded-pill border-2 border-brand-teal py-2.5 text-sm font-semibold text-brand-teal hover:bg-brand-teal hover:text-white"
              >
                {t("pin_modal.copy")}
              </button>
              <button
                onClick={() => setPinResult(null)}
                className="flex-1 btn-primary"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
