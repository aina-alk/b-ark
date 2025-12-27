/**
 * Types supplémentaires pour les endpoints dont le swagger est incomplet.
 * Ces types sont utilisés en complément des types auto-générés.
 */

// Auth responses
export interface AuthResponse {
  authToken: string;
  user_id: number;
}

export interface AuthMeResponse {
  id: number;
  email: string;
  name: string;
  rpps: string | null;
  specialty: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

// User (table built-in Xano étendue)
export interface User {
  id: number;
  email: string;
  name: string;
  rpps: string | null;
  specialty: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

// Patient
export interface Patient {
  id: number;
  ipp: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: 'M' | 'F' | null;
  phone: string | null;
  email: string | null;
  allergies: string[];
  antecedents: string[];
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

// Consultation
export interface Consultation {
  id: number;
  patient_id: number;
  doctor_id: number;
  date: string;
  motif: string | null;
  transcription: string | null;
  context_detected: 'consultation' | 'intervention' | 'unknown';
  symptoms: string[];
  examination: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'validated';
  duration_seconds: number | null;
  created_at: string;
  updated_at: string | null;
  patient?: Patient;
  documents?: Document[];
}

// Intervention
export interface Intervention {
  id: number;
  patient_id: number;
  doctor_id: number;
  date: string;
  type_intervention: string;
  transcription: string | null;
  indication: string | null;
  technique: string | null;
  findings: string | null;
  complications: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'validated';
  duration_minutes: number | null;
  anesthesia_type: string | null;
  created_at: string;
  updated_at: string | null;
  patient?: Patient;
  documents?: Document[];
}

// Document
export interface Document {
  id: number;
  consultation_id: number | null;
  intervention_id: number | null;
  doctor_id: number;
  patient_id: number;
  type: 'cr_consultation' | 'cr_operatoire' | 'ordonnance' | 'courrier';
  title: string | null;
  content: Record<string, unknown>;
  content_text: string | null;
  pdf_url: string | null;
  validated: boolean;
  validated_at: string | null;
  sent_at: string | null;
  recipient_email: string | null;
  version: number;
  created_at: string;
  updated_at: string | null;
}

// Medicament
export interface Medicament {
  id: number;
  nom: string;
  dci: string;
  classe: string;
  forme: string | null;
  posologie_adulte: string | null;
  posologie_enfant: string | null;
  contre_indications: string[];
  interactions: string[];
  precautions: string | null;
  orl_specific: boolean;
}

// Interaction check response
export interface InteractionCheck {
  interactions: {
    medicament1: string;
    medicament2: string | null;
    type: 'interaction' | 'allergie' | 'contre_indication';
    severity: 'low' | 'medium' | 'high';
    message: string;
  }[];
  safe: boolean;
}

// Template CR
export interface TemplateCR {
  id: number;
  name: string;
  type: 'consultation' | 'intervention';
  structure: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
}

// Template Ordonnance
export interface TemplateOrdonnance {
  id: number;
  name: string;
  pathologie: string;
  medicaments: {
    medicament_id: number;
    posologie: string;
    duree: string;
  }[];
  instructions: string | null;
  is_default: boolean;
  created_at: string;
}

// Dashboard stats
export interface DashboardStats {
  total_patients: number;
  consultations_this_month: number;
  interventions_this_month: number;
  documents_pending_validation: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Audit log
export interface AuditLog {
  id: number;
  doctor_id: number;
  action:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'login'
    | 'logout'
    | 'export'
    | 'send';
  entity_type: string;
  entity_id: number;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Analytics event
export interface AnalyticsEvent {
  id: number;
  doctor_id: number | null;
  event_type:
    | 'transcription'
    | 'generation_cr'
    | 'generation_ordonnance'
    | 'generation_courrier'
    | 'export_pdf'
    | 'send_email'
    | 'search_medicament'
    | 'page_view';
  event_data: Record<string, unknown> | null;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}
