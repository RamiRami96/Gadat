import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const RECOVERY_CODE_LENGTH = 16;

export function generateRecoveryCode(): string {
  const bytes = randomBytes(RECOVERY_CODE_LENGTH);
  const raw = Array.from(bytes, (byte) => ALPHABET[byte % 32]).join('');
  return raw.match(/.{4}/g)!.join('-');
}

export function normalizeRecoveryCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

export function hashRecoveryCode(input: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(input)).digest('hex');
}

export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}
