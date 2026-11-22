import type { FINGERPRINT_STATE } from '../constants/auth-constants';

export type UnlockView = 'idle' | 'scanning' | 'success' | 'error' | 'recovery' | 'recovered';

export type SetupStep = 1 | 2 | 3;

export type FingerprintState = (typeof FINGERPRINT_STATE)[keyof typeof FINGERPRINT_STATE];
