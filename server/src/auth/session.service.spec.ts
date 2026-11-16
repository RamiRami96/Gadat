import { jest } from '@jest/globals';
import type { Response } from 'express';
import type { EnvService } from '../common/env.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SESSION_COOKIE, SessionService } from './session.service.js';

type Call = (...args: unknown[]) => Promise<unknown>;

function makePrisma() {
  return {
    session: {
      create: jest.fn<Call>().mockResolvedValue({}),
      deleteMany: jest.fn<Call>().mockResolvedValue({ count: 0 }),
      findFirst: jest.fn<Call>().mockResolvedValue(null),
    },
  };
}

function makeRes() {
  return { cookie: jest.fn(), clearCookie: jest.fn() };
}

describe('SessionService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: SessionService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new SessionService(
      prisma as unknown as PrismaService,
      {
        isProduction: true,
      } as EnvService,
    );
  });

  it('stores only a hash of the random token and sets it as an HttpOnly cookie', async () => {
    const res = makeRes();
    await service.start(res as unknown as Response, 'user-1');

    const token = res.cookie.mock.calls[0][1] as string;
    const options = res.cookie.mock.calls[0][2] as Record<string, unknown>;
    expect(res.cookie.mock.calls[0][0]).toBe(SESSION_COOKIE);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(options).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: true, path: '/api' });

    const { data } = prisma.session.create.mock.calls[0][0] as {
      data: { id: string; userId: string; expiresAt: Date };
    };
    expect(data.id).not.toBe(token);
    expect(data.id).toMatch(/^[0-9a-f]{64}$/);
    expect(data.userId).toBe('user-1');
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('removes expired sessions when a new one starts', async () => {
    await service.create('user-1');
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
  });

  it('verifies a token by its hash and ignores expired or unknown sessions', async () => {
    const token = await service.create('user-1');
    const { data } = prisma.session.create.mock.calls[0][0] as { data: { id: string } };

    prisma.session.findFirst.mockResolvedValueOnce({ userId: 'user-1' });
    await expect(service.verify(token)).resolves.toBe('user-1');
    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: { id: data.id, expiresAt: { gt: expect.any(Date) } },
      select: { userId: true },
    });

    await expect(service.verify(token)).resolves.toBeNull();
    await expect(service.verify(undefined)).resolves.toBeNull();
    await expect(service.verify('')).resolves.toBeNull();
  });

  it('deletes the session and clears the cookie on logout', async () => {
    const res = makeRes();
    await service.end(res as unknown as Response, 'some-token');
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { id: expect.stringMatching(/^[0-9a-f]{64}$/) },
    });
    expect(res.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE, expect.any(Object));

    prisma.session.deleteMany.mockClear();
    await service.end(res as unknown as Response, undefined);
    expect(prisma.session.deleteMany).not.toHaveBeenCalled();
  });
});
