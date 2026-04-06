export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  avatar: string;
  allergies: string[];
}

export interface ClinicalRecord {
  id: number;
  date: string;
  type: "human" | "ai";
  title: string;
  description: string;
  author: string;
}

export interface RecentAccess {
  id: number;
  petName: string;
  tutor: string;
  date: string;
  pin: string;
}

export interface NotePayload {
  title: string;
  description: string;
}
