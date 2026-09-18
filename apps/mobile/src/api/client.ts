import { Platform } from 'react-native';
import { ApiErrorBody } from '@right-trade/shared';
import { getAuthToken } from './tokenHolder';

function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // On web with no explicit override, talk to whatever origin served this
  // page. This makes a single deployment (API serving the built web app)
  // work with zero configuration — see apps/api/src/app.ts.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // Native (iOS/Android): only reachable with an explicit LAN/deployed URL.
  return 'http://localhost:4000';
}

/**
 * Points at the Right Trade API. Override by setting EXPO_PUBLIC_API_URL
 * (e.g. to your machine's LAN IP for a physical device/emulator) before
 * `expo start` — `localhost` only resolves to a machine's own API.
 */
export const API_BASE_URL = resolveApiBaseUrl();

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
