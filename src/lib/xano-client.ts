import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

/**
 * Base URL for all Xano API groups.
 * The swagger.json paths include the API group prefix (e.g., /api:QC35j52Y/auth/login),
 * so we only need the base domain here.
 */
const XANO_BASE_URL = 'https://api.mananjo.fr';

// Create the base openapi-fetch client
const client = createClient<paths>({
  baseUrl: XANO_BASE_URL,
});

// Storage for auth token
let authToken: string | null = null;

// Add auth middleware
client.use({
  async onRequest({ request }) {
    if (authToken) {
      request.headers.set('Authorization', `Bearer ${authToken}`);
    }
    return request;
  },
  async onResponse({ response }) {
    // Handle 401 - token expired
    if (response.status === 401) {
      clearXanoToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return response;
  },
});

// Token management
export function setXanoToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('xano_token', token);
  }
}

export function clearXanoToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('xano_token');
  }
}

export function initXanoFromStorage() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('xano_token');
    if (token) {
      authToken = token;
    }
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export { client };
