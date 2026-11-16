import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { EnvService } from '../common/env.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const SESSION_COOKIE = 'session';
export const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
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

  async create(userId: string): Promise<string> {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await this.prisma.session.create({
      data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + SESSION_MS) },
    });
    return token;
  }

  async start(res: Response, userId: string): Promise<void> {
    const token = await this.create(userId);
    res.cookie(SESSION_COOKIE, token, { ...this.cookieOptions(), maxAge: SESSION_MS });
  }

  async end(res: Response, token: unknown): Promise<void> {
    if (typeof token === 'string' && token.length > 0) {
      await this.prisma.session.deleteMany({ where: { id: hashToken(token) } });
    }
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  async verify(token: unknown): Promise<string | null> {
    if (typeof token !== 'string' || token.length === 0) return null;
    const session = await this.prisma.session.findFirst({
      where: { id: hashToken(token), expiresAt: { gt: new Date() } },
      select: { userId: true },
    });
    return session?.userId ?? null;
  }
}
