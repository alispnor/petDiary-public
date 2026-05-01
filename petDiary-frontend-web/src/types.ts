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
// Membros do pet (PetMember)
// =========================================

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

export interface InviteMemberPayload {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  whatsapp?: boolean;
  document?: string;
  temporary_password: string;
  address_zip?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_district?: string;
  address_city?: string;
  address_state?: string;
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

// =========================================
// Anexos (uploads em health records)
// =========================================

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

// =========================================
// Auditoria
// =========================================

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "REVOKE" | "CLAIM";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  description: string;
  actor_name_snapshot: string;
  actor_role_snapshot: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// =========================================
// Assinatura (billing)
// =========================================

export type SubscriptionPlan = "FREE" | "PRO";
export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIAL";

export interface Subscription {
  id: string;
  plan_type: SubscriptionPlan;
  status: SubscriptionStatus;
  is_pro_active: boolean;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

// =========================================
// Notificações (Spec 17)
// =========================================

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
