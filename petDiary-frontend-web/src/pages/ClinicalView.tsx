import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useClinicalStore } from "../store/clinicalStore";
import PetHeader from "../components/PetHeader";
import Timeline from "../components/Timeline";
import NoteForm from "../components/NoteForm";
import RevokedModal from "../components/RevokedModal";

export default function ClinicalView() {
  const navigate = useNavigate();
  const revoked = useAuthStore((s) => s.revoked);
  const clearRevoked = useAuthStore((s) => s.clearRevoked);
  const logout = useAuthStore((s) => s.logout);
  const pet = useClinicalStore((s) => s.pet);
  const timeline = useClinicalStore((s) => s.timeline);
  const notes = useClinicalStore((s) => s.notes);
  const addNote = useClinicalStore((s) => s.addNote);

  const allRecords = [...notes, ...timeline];

  const handleDismissRevoked = () => {
    clearRevoked();
    logout();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!useAuthStore.getState().token && !revoked) {
      navigate("/", { replace: true });
    }
  }, [navigate, revoked]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <h1 className="text-lg font-bold text-indigo-700">
          PetDiary <span className="text-gray-400">Prontuário</span>
        </h1>
        <button
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
          className="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
        >
          Sair
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <PetHeader pet={pet} />
          <Timeline records={allRecords} />
        </div>

        {/* Right sidebar — Add note */}
        <aside className="w-96 border-l border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            Nova Nota Clínica
          </h2>
          <NoteForm onSubmit={addNote} />
        </aside>
      </div>

      {/* 403 — Acesso Revogado */}
      {revoked && <RevokedModal onDismiss={handleDismissRevoked} />}
    </div>
  );
}
