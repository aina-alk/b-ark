/**
 * Types pour le module d'authentification
 */

export interface User {
  id: number;
  email: string;
  name: string;
  rpps: string | null;
  specialty: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  authToken: string;
  user_id: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  rpps?: string;
  specialty?: string;
}
