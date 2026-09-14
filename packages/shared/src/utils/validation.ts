export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongEnoughPassword(password: string): boolean {
  return password.length >= 8;
}
