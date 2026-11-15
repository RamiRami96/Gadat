import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { EnvService } from '../common/env.service.js';

export const SESSION_COOKIE = 'session';
export const SESSION_DAYS = 30;

/** Issues and verifies the session: a signed JWT holding only the user id, in an HttpOnly cookie. */
@Injectable()
export class SessionService {
  constructor(
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.env.isProduction,
      path: '/api',
    };
  }

  async start(res: Response, userId: string): Promise<void> {
    const token = await this.jwt.signAsync({ sub: userId }, { expiresIn: `${SESSION_DAYS}d` });
    res.cookie(SESSION_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  clear(res: Response): void {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  /** Returns the user id inside a valid token, or null. */
  async verify(token: unknown): Promise<string | null> {
    if (typeof token !== 'string' || token.length === 0) return null;
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown }>(token);
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
