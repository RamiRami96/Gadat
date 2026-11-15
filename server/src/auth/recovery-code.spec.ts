import {
  generateRecoveryCode,
  hashesMatch,
  hashRecoveryCode,
  normalizeRecoveryCode,
} from './recovery-code.js';

describe('recovery code', () => {
  it('has 16 characters in four dash-separated groups', () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){3}$/);
  });

  it('is different every time', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateRecoveryCode()));
    expect(codes.size).toBe(200);
  });

  it('hashes loosely typed input to the same SHA-256 digest', () => {
    expect(normalizeRecoveryCode(' abcd-efgh jklm-npqr ')).toBe('ABCDEFGHJKLMNPQR');
    expect(hashRecoveryCode('abcd efgh jklm npqr')).toBe(hashRecoveryCode('ABCD-EFGH-JKLM-NPQR'));
    expect(hashRecoveryCode('ABCD-EFGH-JKLM-NPQR')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('compares digests without being fooled by different lengths', () => {
    const a = hashRecoveryCode('AAAA-AAAA-AAAA-AAAA');
    expect(hashesMatch(a, a)).toBe(true);
    expect(hashesMatch(a, hashRecoveryCode('BBBB-BBBB-BBBB-BBBB'))).toBe(false);
    expect(hashesMatch(a, 'abcd')).toBe(false);
  });
});
