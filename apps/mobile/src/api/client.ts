import { ApiErrorBody } from '@right-trade/shared';
import { getAuthToken } from './tokenHolder';

/**
 * Points at the Right Trade API. Override for a device/simulator by setting
 * EXPO_PUBLIC_API_URL (e.g. to your machine's LAN IP) before `expo start`,
 * since `localhost` only works for a web build or an iOS simulator on the
 * same machine as the API.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  code: string;
  details?: Record<string, string>;

  constructor(code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach the Right Trade server. Check your connection and try again.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errBody = body as ApiErrorBody | null;
    throw new ApiError(
      errBody?.error?.code ?? 'UNKNOWN_ERROR',
      errBody?.error?.message ?? 'Something went wrong. Please try again.',
      errBody?.error?.details,
    );
  }

  return body as T;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
};
