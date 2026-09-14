/**
 * Plain module-level holder for the current auth token, read by the API
 * client on every request. Kept separate from the auth store so the store
 * and the client don't need to import each other.
 */
let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}
