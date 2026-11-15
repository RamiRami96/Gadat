import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// Exactly 32 symbols (5 bits each; 256 % 32 === 0 so every symbol is equally likely).
// 0, 1, I and O are left out because they look alike.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const RECOVERY_CODE_LENGTH = 16;

/** 16 random characters shown as XXXX-XXXX-XXXX-XXXX (80 bits of entropy). */
export function generateRecoveryCode(): string {
  const bytes = randomBytes(RECOVERY_CODE_LENGTH);
  let raw = '';
  for (const byte of bytes) raw += ALPHABET[byte % 32];
  return raw.match(/.{4}/g)!.join('-');
}

/** Removes dashes and spaces and upper-cases, so users can type the code loosely. */
export function normalizeRecoveryCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

export function hashRecoveryCode(input: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(input)).digest('hex');
}

/** Constant-time comparison of two hex SHA-256 digests. */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}
