export type Species = "DOG" | "CAT" | "BIRD" | "OTHER";

export interface Pet {
  id: string;
  tutor: string;
  name: string;
  species: Species;
  breed: string;
  weight_kg: string | null;
  created_at: string;
  updated_at: string;
}

export type RecordType =
  | "VACCINE"
  | "EXAM"
  | "PRESCRIPTION"
  | "SURGERY"
  | "NOTE";

export interface HealthRecord {
  id: string;
  pet: string;
  author: string | null;
  record_type: RecordType;
  title: string;
  description: string;
  date_occurred: string;
  raw_extracted_text: string;
  created_at: string;
  updated_at: string;
}

export interface VetAccessToken {
  id: string;
  pet: string;
  vet: string | null;
  access_code: string;
  expires_at: string;
  is_active: boolean;
  is_used: boolean;
  claimed_at: string | null;
  created_at: string;
}

export interface NotePayload {
  title: string;
  description: string;
}

// =========================================
// Resumos retornados por /access/active e /access/history
// =========================================

export interface PetSummary {
  id: string;
  name: string;
  species: Species;
  breed: string;
}

export interface VetSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  crmv: string;
  clinic_name: string;
}

export interface TutorSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

export type AccessStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export interface ActiveAccess {
  id: string;
  pet: PetSummary;
  vet: VetSummary;
  claimed_at: string;
  expires_at: string;
  last_visit: string | null;
}

export interface AccessHistory {
  id: string;
  pet: PetSummary;
  tutor: TutorSummary;
  claimed_at: string;
  expires_at: string;
  last_visit: string | null;
  status: AccessStatus;
}
