/**
 * Environment-agnostic UUID v4 generator (works in Node and React Native
 * without relying on the `crypto` module, since this file is bundled by
 * both the API and the Expo app).
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
