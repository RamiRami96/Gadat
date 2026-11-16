import { jest } from '@jest/globals';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { EnvService } from '../common/env.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { hashRecoveryCode } from './recovery-code.js';

const generateRegistrationOptions = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const verifyRegistrationResponse = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const generateAuthenticationOptions = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const verifyAuthenticationResponse = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('@simplewebauthn/server', () => ({
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
}));

const { AuthService } = await import('./auth.service.js');

const env = {
  rpId: 'localhost',
  rpName: 'Gӓdӓt',
  origin: 'http://localhost:4200',
} as EnvService;

function makePrisma() {
  return {
    user: {
      create: jest
        .fn<(...args: unknown[]) => Promise<unknown>>()
        .mockResolvedValue({ id: 'user-1' }),
      update: jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({}),
      deleteMany: jest
        .fn<(...args: unknown[]) => Promise<unknown>>()
        .mockResolvedValue({ count: 0 }),
    },
    credential: {
      count: jest.fn<(...args: unknown[]) => Promise<number>>().mockResolvedValue(0),
      findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      findMany: jest.fn<(...args: unknown[]) => Promise<unknown[]>>().mockResolvedValue([]),
      create: jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({}),
      update: jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({}),
    },
    recoveryCode: {
      findFirst: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      updateMany: jest.fn<(...args: unknown[]) => Promise<{ count: number }>>(),
    },
  };
}

describe('AuthService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: InstanceType<typeof AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = makePrisma();
    service = new AuthService(prisma as unknown as PrismaService, env);
  });

  describe('startRegistration', () => {
    it('creates a user and asks for a platform passkey with user verification', async () => {
      generateRegistrationOptions.mockResolvedValue({ challenge: 'chal-1' });
      const { options, state } = await service.startRegistration();

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpName: 'Gӓdӓt',
          rpID: 'localhost',
          attestationType: 'none',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'required',
            userVerification: 'required',
          },
        }),
      );
      expect(options).toEqual({ challenge: 'chal-1' });
      expect(state).toEqual({ kind: 'register', challenge: 'chal-1', userId: 'user-1' });
    });
  });

  describe('finishRegistration', () => {
    const verified = {
      verified: true,
      registrationInfo: {
        credential: {
          id: 'cred-1',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
          transports: ['internal'],
        },
      },
    };

    it('stores the credential and a hashed recovery code, and returns the code once', async () => {
      verifyRegistrationResponse.mockResolvedValue(verified);
      const result = await service.finishRegistration(
        { kind: 'register', challenge: 'chal-1', userId: 'user-1' },
        { id: 'cred-1' },
      );

      expect(verifyRegistrationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'chal-1',
          expectedOrigin: 'http://localhost:4200',
          expectedRPID: 'localhost',
          requireUserVerification: true,
        }),
      );
      expect(result.userId).toBe('user-1');
      expect(result.recoveryCode).toMatch(/^[2-9A-Z]{4}(-[2-9A-Z]{4}){3}$/);

      const { data } = prisma.user.update.mock.calls[0][0] as {
        data: {
          credentials: { create: Record<string, unknown> };
          recovery: { create: { hash: string } };
        };
      };
      expect(data.credentials.create).toMatchObject({
        id: 'cred-1',
        counter: 0,
        transports: ['internal'],
      });
      expect(Buffer.isBuffer(data.credentials.create.publicKey)).toBe(true);
      expect(data.recovery.create.hash).toBe(hashRecoveryCode(result.recoveryCode));
      expect(JSON.stringify(data)).not.toContain(result.recoveryCode);
    });

    it('rejects a response the library cannot verify', async () => {
      verifyRegistrationResponse.mockRejectedValue(new Error('bad origin'));
      await expect(
        service.finishRegistration(
          { kind: 'register', challenge: 'c', userId: 'user-1' },
          { id: 'x' },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a response that is not verified', async () => {
      verifyRegistrationResponse.mockResolvedValue({ verified: false });
      await expect(
        service.finishRegistration(
          { kind: 'register', challenge: 'c', userId: 'user-1' },
          { id: 'x' },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to register twice for the same user', async () => {
      prisma.credential.count.mockResolvedValue(1);
      await expect(
        service.finishRegistration(
          { kind: 'register', challenge: 'c', userId: 'user-1' },
          { id: 'x' },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(verifyRegistrationResponse).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('offers a discoverable credential flow without an allow-list', async () => {
      generateAuthenticationOptions.mockResolvedValue({ challenge: 'chal-2' });
      const { state } = await service.startLogin();
      expect(generateAuthenticationOptions).toHaveBeenCalledWith({
        rpID: 'localhost',
        userVerification: 'required',
      });
      expect(state).toEqual({ kind: 'login', challenge: 'chal-2' });
    });

    const stored = {
      id: 'cred-1',
      userId: 'user-1',
      publicKey: Buffer.from([9]),
      counter: 4,
      transports: ['internal'],
    };

    it('verifies the signature and stores the new counter', async () => {
      prisma.credential.findUnique.mockResolvedValue(stored);
      verifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      const result = await service.finishLogin(
        { kind: 'login', challenge: 'chal-2' },
        { id: 'cred-1' },
      );

      expect(result).toEqual({ userId: 'user-1' });
      expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'chal-2',
          requireUserVerification: true,
          credential: expect.objectContaining({ id: 'cred-1', counter: 4 }),
        }),
      );
      expect(prisma.credential.update).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: { counter: 5 },
      });
    });

    it('rejects an unknown credential', async () => {
      prisma.credential.findUnique.mockResolvedValue(null);
      await expect(
        service.finishLogin({ kind: 'login', challenge: 'c' }, { id: 'nope' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it('rejects a bad signature and leaves the counter alone', async () => {
      prisma.credential.findUnique.mockResolvedValue(stored);
      verifyAuthenticationResponse.mockRejectedValue(new Error('counter went backwards'));
      await expect(
        service.finishLogin({ kind: 'login', challenge: 'c' }, { id: 'cred-1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.credential.update).not.toHaveBeenCalled();
    });
  });

  describe('useRecoveryCode', () => {
    it('swaps in a new code and returns it', async () => {
      const code = 'ABCD-EFGH-JKLM-NPQR';
      prisma.recoveryCode.findFirst.mockResolvedValue({
        userId: 'user-1',
        hash: hashRecoveryCode(code),
      });
      prisma.recoveryCode.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.useRecoveryCode(code.toLowerCase());

      expect(result.userId).toBe('user-1');
      expect(result.recoveryCode).not.toBe(code);
      expect(prisma.recoveryCode.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', hash: hashRecoveryCode(code) },
        data: { hash: hashRecoveryCode(result.recoveryCode) },
      });
    });

    it('rejects a code that does not exist', async () => {
      prisma.recoveryCode.findFirst.mockResolvedValue(null);
      await expect(service.useRecoveryCode('ABCD-EFGH-JKLM-NPQR')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when another request used the same code first', async () => {
      prisma.recoveryCode.findFirst.mockResolvedValue({
        userId: 'u',
        hash: hashRecoveryCode('ABCD-EFGH-JKLM-NPQR'),
      });
      prisma.recoveryCode.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.useRecoveryCode('ABCD-EFGH-JKLM-NPQR')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('adding a passkey on a new device', () => {
    it('excludes passkeys the user already has', async () => {
      prisma.credential.findMany.mockResolvedValue([{ id: 'cred-1', transports: ['internal'] }]);
      generateRegistrationOptions.mockResolvedValue({ challenge: 'chal-3' });
      const { state } = await service.startAddCredential('user-1');
      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: [{ id: 'cred-1', transports: ['internal'] }],
        }),
      );
      expect(state).toEqual({ kind: 'add', challenge: 'chal-3', userId: 'user-1' });
    });

    it('saves the extra credential for the signed-in user', async () => {
      verifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'cred-2', publicKey: new Uint8Array([7]), counter: 0 },
        },
      });
      await service.finishAddCredential(
        'user-1',
        { kind: 'add', challenge: 'c', userId: 'user-1' },
        { id: 'cred-2' },
      );
      expect(prisma.credential.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ id: 'cred-2', userId: 'user-1' }),
      });
    });

    it('refuses a challenge that was issued to someone else', async () => {
      await expect(
        service.finishAddCredential(
          'user-1',
          { kind: 'add', challenge: 'c', userId: 'user-2' },
          { id: 'x' },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
