import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { EnvService } from '../common/env.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type ChallengeKind = 'register' | 'login' | 'add';

export interface ChallengeState {
  kind: ChallengeKind;
  challenge: string;
  userId?: string;
}

const COOKIE = 'chal';
const FIVE_MINUTES = 5 * 60 * 1000;
const ID_BYTES = 32;

// The challenge itself stays on the server. The cookie only carries the id of a row that is
// deleted the first time it is read, so a captured cookie cannot be replayed.
@Injectable()
export class ChallengeCookie {
  constructor(
    private readonly env: EnvService,
    private readonly prisma: PrismaService,
  ) {}

  private options() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.env.isProduction,
      path: '/api',
    };
  }

  public async set(res: Response, state: ChallengeState): Promise<void> {
    const id = randomBytes(ID_BYTES).toString('base64url');
    await this.prisma.challenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await this.prisma.challenge.create({
      data: {
        id,
        kind: state.kind,
        challenge: state.challenge,
        userId: state.userId ?? null,
        expiresAt: new Date(Date.now() + FIVE_MINUTES),
      },
    });
    res.cookie(COOKIE, id, { ...this.options(), signed: true, maxAge: FIVE_MINUTES });
  }

  public async take(
    req: Request,
    res: Response,
    kind: ChallengeKind,
  ): Promise<ChallengeState | null> {
    const id: unknown = req.signedCookies?.[COOKIE];
    res.clearCookie(COOKIE, this.options());
    if (typeof id !== 'string' || id.length === 0) return null;
    let row;
    try {
      row = await this.prisma.challenge.delete({ where: { id } });
    } catch {
      return null;
    }
    if (row.expiresAt.getTime() <= Date.now() || row.kind !== kind) return null;
    return { kind, challenge: row.challenge, userId: row.userId ?? undefined };
  }
}
