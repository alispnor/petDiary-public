import { useState } from "react";
import type { NotePayload } from "../types";
import api from "../services/api";

interface NoteFormProps {
  onSubmit: (note: NotePayload) => void;
}

export default function NoteForm({ onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim() });
    setTitle("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Título da nota"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <textarea
        rows={6}
        placeholder="Descreva observações clínicas, prescrições, exames solicitados…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!title.trim() || !description.trim()}
        className="rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        Adicionar Nota
      </button>

      <button
        type="button"
        onClick={() => {
          // Simula uma requisição que retorna 403 — interceptor do Axios
          // detecta e dispara revokeAccess() no authStore
          api.get("/access/simulate-revoke/").catch(() => {});
        }}
        className="rounded-lg border border-red-300 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
      >
        Simular Revogação de PIN (teste)
      </button>
    </form>
  );
}
