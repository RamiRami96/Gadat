export const SETUP_BENEFITS: readonly string[] = [
  'Unlock with a touch. There is no password to remember.',
  'Your fingerprint never leaves this device.',
  'No email and no account details, so nothing to leak.',
];

export const SETUP_STEPS = [1, 2, 3] as const;

export const SUCCESS_DELAY_MS = 600;

export const TOO_MANY_TRIES = 'Too many tries. Wait a minute and try again.';
export const SETUP_FAILED =
  'We could not set up your fingerprint. Check that this device has a fingerprint or screen lock set up, then try again.';
export const ADD_FINGERPRINT_FAILED =
  'Could not add a fingerprint on this device. You can try again from here later.';
export const RECOVERY_INVALID = 'That recovery code is not valid. Each code works once.';
export const SERVER_UNREACHABLE = 'Could not reach the server. Try again.';

export const RECOVERY_CODE_MIN_LENGTH = 8;
