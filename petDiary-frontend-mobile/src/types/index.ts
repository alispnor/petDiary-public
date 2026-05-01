// Tipos espelhando o backend Django

export type UserRole = "TUTOR" | "VET";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  whatsapp: boolean;
  document?: string;
  crmv?: string;
  clinic_name?: string;
  must_change_password?: boolean;
}

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

export type RecordType = "VACCINE" | "EXAM" | "PRESCRIPTION" | "SURGERY" | "NOTE";

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

export type MemberRole = "OWNER" | "CARETAKER";

export interface MemberUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
}

export interface PetMember {
  id: string;
  user: MemberUser;
  role: MemberRole;
  added_at: string;
}

export interface VetSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  crmv: string;
  clinic_name: string;
}

export interface PetSummary {
  id: string;
  name: string;
  species: Species;
  breed: string;
}

export interface ActiveAccess {
  id: string;
  pet: PetSummary;
  vet: VetSummary;
  claimed_at: string;
  expires_at: string;
  last_visit: string | null;
}

export interface Attachment {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  view_url: string;
  download_url: string;
  uploaded_at: string;
  uploader_name?: string;
}

export type NotificationType =
  | "VACCINE"
  | "VET_RETURN"
  | "PAYMENT_DUE"
  | "PAYMENT_OK"
  | "PIN_GENERATED"
  | "VET_ACCESS_CLAIMED"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  push_vaccine: boolean;
  push_vet_return: boolean;
  push_payment_due: boolean;
  push_payment_ok: boolean;
  push_pin_generated: boolean;
  push_vet_access_claimed: boolean;
  push_system: boolean;
  email_enabled: boolean;
}

export type Language = "pt-BR" | "en-US" | "es-ES";

export interface AppState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  activePet: Pet | null;
  language: Language;

  setAuth: (token: string, refreshToken: string, user: User) => void;
  setActivePet: (pet: Pet | null) => void;
  setLanguage: (language: Language) => void;
  logout: () => void;
}
