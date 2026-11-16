import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { EnvService } from '../common/env.service.js';

export type ChallengeKind = 'register' | 'login' | 'add';

export interface ChallengeState {
  kind: ChallengeKind;
  challenge: string;
  userId?: string;
}

const COOKIE = 'chal';
const FIVE_MINUTES = 5 * 60 * 1000;

@Injectable()
export class ChallengeCookie {
  constructor(private readonly env: EnvService) {}

  private options() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.env.isProduction,
      path: '/api',
    };
  }

  set(res: Response, state: ChallengeState): void {
    res.cookie(COOKIE, JSON.stringify(state), {
      ...this.options(),
      signed: true,
      maxAge: FIVE_MINUTES,
    });
  }

  take(req: Request, res: Response, kind: ChallengeKind): ChallengeState | null {
    const raw: unknown = req.signedCookies?.[COOKIE];
    res.clearCookie(COOKIE, this.options());
    if (typeof raw !== 'string') return null;
    try {
      const state = JSON.parse(raw) as Partial<ChallengeState>;
      if (state.kind !== kind || typeof state.challenge !== 'string') return null;
      return { kind, challenge: state.challenge, userId: state.userId };
    } catch {
      return null;
    }
  }
}
