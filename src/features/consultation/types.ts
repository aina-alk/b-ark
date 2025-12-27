/**
 * Types pour le module de consultation
 */

export type ConsultationStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "validated";
export type ContextType = "consultation" | "intervention" | "unknown";

export interface Consultation {
  id: number;
  patient_id: number;
  doctor_id: number;
  date: string;
  motif: string | null;
  transcription: string | null;
  context_detected: ContextType;
  symptoms: string[];
  examination: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  status: ConsultationStatus;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string | null;
}
