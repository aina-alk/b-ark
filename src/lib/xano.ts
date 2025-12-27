import { client } from './xano-client';

// Re-export token management
export {
  setXanoToken,
  clearXanoToken,
  initXanoFromStorage,
  getAuthToken,
} from './xano-client';

// Custom error class for API errors
export class XanoApiError extends Error {
  code: string;
  status: number;
  field?: string;

  constructor(message: string, code: string, status: number, field?: string) {
    super(message);
    this.name = 'XanoApiError';
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

// Helper to extract error details from response
export function extractError(error: unknown): {
  message: string;
  code: string;
  field?: string;
} {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    return {
      message: (err.message as string) || 'API Error',
      code: (err.code as string) || 'UNKNOWN',
      field: err.field as string | undefined,
    };
  }
  return { message: 'API Error', code: 'UNKNOWN' };
}

// Helper to handle API response and throw on error
export function handleApiResponse<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.error) {
    const { message, code, field } = extractError(result.error);
    throw new XanoApiError(message, code, result.response.status, field);
  }
  return result.data as T;
}

// Re-export the typed client for direct use
// Usage: const data = handleApiResponse(await client.GET('/api:xxx/endpoint', { params: {...} }))
export { client };
