export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  avatar?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
  birthDate?: string;
  avatarUrl?: string;
  ownerId: string;
}

export interface TimelineRecord {
  id: string;
  petId: string;
  type: 'vaccine' | 'consultation' | 'exam' | 'medication' | 'note';
  title: string;
  description?: string;
  date: string;
  documentUrl?: string;
}

export type Language = 'pt-BR' | 'en-US' | 'es-ES';

export interface AppState {
  user: User | null;
  activePet: Pet | null;
  language: Language;
  setUser: (user: User | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setLanguage: (language: Language) => void;
  logout: () => void;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface DocumentProcessResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
}
