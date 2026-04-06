import { create } from "zustand";
import type { Pet, ClinicalRecord, NotePayload } from "../types";

const MOCK_PET: Pet = {
  id: "pet-001",
  name: "Thor",
  species: "Cão",
  breed: "Golden Retriever",
  age: "4 anos",
  weight: "32 kg",
  avatar: "https://placedog.net/100/100?random",
  allergies: ["Dipirona", "Frango"],
};

const MOCK_TIMELINE: ClinicalRecord[] = [
  {
    id: 1,
    date: "2026-03-28",
    type: "human",
    title: "Consulta de rotina",
    description: "Vacina V10 aplicada. Peso estável.",
    author: "Dra. Camila",
  },
  {
    id: 2,
    date: "2026-03-15",
    type: "ai",
    title: "Transcrição de áudio — Retorno dermatológico",
    description:
      "Paciente apresentou melhora significativa nas lesões cutâneas após tratamento com cefalexina 30mg/kg BID por 21 dias. Proprietária relata que prurido reduziu ~80%.",
    author: "IA — Whisper Transcription",
  },
  {
    id: 3,
    date: "2026-02-10",
    type: "human",
    title: "Hemograma completo",
    description: "Resultados dentro da normalidade. Sem alterações relevantes.",
    author: "Lab VetClin",
  },
  {
    id: 4,
    date: "2026-01-05",
    type: "ai",
    title: "Transcrição — Emergência GI",
    description:
      "Episódio de vômito e diarréia. Tutor relata ingestão de corpo estranho (pedaço de brinquedo). Raio-X solicitado.",
    author: "IA — Whisper Transcription",
  },
];

interface ClinicalState {
  pet: Pet;
  timeline: ClinicalRecord[];
  notes: ClinicalRecord[];
  addNote: (note: NotePayload) => void;
}

export const useClinicalStore = create<ClinicalState>((set) => ({
  pet: MOCK_PET,
  timeline: MOCK_TIMELINE,
  notes: [],

  addNote: (note) =>
    set((state) => ({
      notes: [
        {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          type: "human" as const,
          title: note.title,
          description: note.description,
          author: "Veterinário (você)",
        },
        ...state.notes,
      ],
    })),
}));
