'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  client,
  handleApiResponse,
  setXanoToken,
  clearXanoToken,
  XanoApiError,
} from '@/lib/xano';
import type { LoginInput, RegisterInput } from '../schemas';

interface AuthResponse {
  authToken?: string;
  user_id?: string;
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginInput): Promise<AuthResponse> => {
      const result = await client.POST('/api:QC35j52Y/auth/login', {
        body: {
          email: data.email,
          password: data.password,
        },
      });
      return handleApiResponse(result);
    },
    onSuccess: (data) => {
      if (data.authToken) {
        setXanoToken(data.authToken);
        router.push('/dashboard');
      }
    },
    onError: (error: Error) => {
      if (error instanceof XanoApiError) {
        if (error.status === 401) {
          throw new Error('Email ou mot de passe incorrect');
        }
        if (error.status === 403) {
          throw new Error("Compte désactivé. Contactez l'administrateur.");
        }
      }
      throw error;
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterInput): Promise<AuthResponse> => {
      const result = await client.POST('/api:QC35j52Y/auth/signup', {
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
        },
      });
      return handleApiResponse(result);
    },
    onSuccess: (data) => {
      if (data.authToken) {
        setXanoToken(data.authToken);
        router.push('/dashboard');
      }
    },
    onError: (error: Error) => {
      if (error instanceof XanoApiError) {
        if (error.message.includes('already exists')) {
          throw new Error('Cet email est déjà utilisé');
        }
      }
      throw error;
    },
  });
}

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const result = await client.POST('/api:QC35j52Y/auth/logout');
      return handleApiResponse(result);
    },
    onSuccess: () => {
      clearXanoToken();
      router.push('/login');
    },
    onError: () => {
      clearXanoToken();
      router.push('/login');
    },
  });
}
