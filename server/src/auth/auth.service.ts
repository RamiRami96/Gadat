import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { EnvService } from '../common/env.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ChallengeState } from './challenge.js';
import { generateRecoveryCode, hashesMatch, hashRecoveryCode } from './recovery-code.js';

const ABANDONED_SIGNUP_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
  ) {}

  async startRegistration(): Promise<{
    options: PublicKeyCredentialCreationOptionsJSON;
    state: ChallengeState;
  }> {
    await this.prisma.user.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - ABANDONED_SIGNUP_MS) },
        credentials: { none: {} },
      },
    });
    const user = await this.prisma.user.create({ data: {} });
    const options = await this.creationOptions(user.id, []);
    return { options, state: { kind: 'register', challenge: options.challenge, userId: user.id } };
  }

  async finishRegistration(
    state: ChallengeState,
    body: Record<string, unknown>,
  ): Promise<{ userId: string; recoveryCode: string }> {
    const { userId } = state;
    if (!userId) throw new BadRequestException('Registration was not started');
    const existing = await this.prisma.credential.count({ where: { userId } });
    if (existing > 0) throw new BadRequestException('Registration was already completed');

    const credential = await this.verifyRegistration(state.challenge, body);
    const recoveryCode = generateRecoveryCode();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        credentials: { create: credential },
        recovery: { create: { hash: hashRecoveryCode(recoveryCode) } },
      },
    });
    return { userId, recoveryCode };
  }

  async startLogin(): Promise<{
    options: PublicKeyCredentialRequestOptionsJSON;
    state: ChallengeState;
  }> {
    const options = await generateAuthenticationOptions({
      rpID: this.env.rpId,
      userVerification: 'required',
    });
    return { options, state: { kind: 'login', challenge: options.challenge } };
  }

  async finishLogin(
    state: ChallengeState,
    body: Record<string, unknown>,
  ): Promise<{ userId: string }> {
    const response = body as unknown as AuthenticationResponseJSON;
    if (typeof response?.id !== 'string') throw new BadRequestException('Invalid passkey response');
    const stored = await this.prisma.credential.findUnique({ where: { id: response.id } });
    if (!stored) throw new UnauthorizedException('Fingerprint not recognised');

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: state.challenge,
        expectedOrigin: this.env.origin,
        expectedRPID: this.env.rpId,
        requireUserVerification: true,
        credential: {
          id: stored.id,
          publicKey: new Uint8Array(stored.publicKey),
          counter: stored.counter,
          transports: stored.transports,
        },
      });
    } catch {
      throw new UnauthorizedException('Fingerprint not recognised');
    }
    if (!verification.verified) throw new UnauthorizedException('Fingerprint not recognised');

    await this.prisma.credential.update({
      where: { id: stored.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });
    return { userId: stored.userId };
  }

  async useRecoveryCode(code: string): Promise<{ userId: string; recoveryCode: string }> {
    const hash = hashRecoveryCode(code);
    const row = await this.prisma.recoveryCode.findFirst({ where: { hash } });
    if (!row || !hashesMatch(row.hash, hash)) {
      throw new UnauthorizedException('That recovery code is not valid');
    }
    const recoveryCode = generateRecoveryCode();
    const swapped = await this.prisma.recoveryCode.updateMany({
      where: { userId: row.userId, hash },
      data: { hash: hashRecoveryCode(recoveryCode) },
    });
    if (swapped.count !== 1) throw new UnauthorizedException('That recovery code is not valid');
    return { userId: row.userId, recoveryCode };
  }

  async startAddCredential(userId: string): Promise<{
    options: PublicKeyCredentialCreationOptionsJSON;
    state: ChallengeState;
  }> {
    const existing = await this.prisma.credential.findMany({ where: { userId } });
    const options = await this.creationOptions(
      userId,
      existing.map((c) => ({ id: c.id, transports: c.transports })),
    );
    return { options, state: { kind: 'add', challenge: options.challenge, userId } };
  }

  async finishAddCredential(
    userId: string,
    state: ChallengeState,
    body: Record<string, unknown>,
  ): Promise<void> {
    if (state.userId !== userId) throw new BadRequestException('Challenge belongs to another user');
    const credential = await this.verifyRegistration(state.challenge, body);
    await this.prisma.credential.create({ data: { ...credential, userId } });
  }

  private creationOptions(userId: string, exclude: { id: string; transports?: string[] }[]) {
    return generateRegistrationOptions({
      rpName: this.env.rpName,
      rpID: this.env.rpId,
      userName: `${this.env.rpName} ${userId.slice(0, 8)}`,
      userDisplayName: this.env.rpName,
      userID: new TextEncoder().encode(userId),
      attestationType: 'none',
      excludeCredentials: exclude,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        userVerification: 'required',
      },
    });
  }

  private async verifyRegistration(challenge: string, body: Record<string, unknown>) {
    const response = body as unknown as RegistrationResponseJSON;
    if (typeof response?.id !== 'string') throw new BadRequestException('Invalid passkey response');
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: this.env.origin,
        expectedRPID: this.env.rpId,
        requireUserVerification: true,
      });
    } catch {
      throw new BadRequestException('Could not verify the fingerprint');
    }
    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Could not verify the fingerprint');
    }
    const { credential } = verification.registrationInfo;
    return {
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? response.response?.transports ?? [],
    };
  }
}
