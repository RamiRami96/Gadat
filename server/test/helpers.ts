import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { generateRecoveryCode, hashRecoveryCode } from '../src/auth/recovery-code.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  userIds: string[];
  signIn(): Promise<{ id: string; cookie: string; recoveryCode: string }>;
  close(): Promise<void>;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  const prisma = app.get(PrismaService);
  const jwt = app.get(JwtService);
  const userIds: string[] = [];

  return {
    app,
    prisma,
    userIds,
    async signIn() {
      const recoveryCode = generateRecoveryCode();
      const user = await prisma.user.create({
        data: { recovery: { create: { hash: hashRecoveryCode(recoveryCode) } } },
      });
      userIds.push(user.id);
      const token = await jwt.signAsync({ sub: user.id }, { expiresIn: '1h' });
      return { id: user.id, cookie: `session=${token}`, recoveryCode };
    },
    async close() {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await app.close();
    },
  };
}

export function api(ctx: TestContext, cookie?: string) {
  const server = ctx.app.getHttpServer();
  const withAuth = (req: request.Test) => {
    req.set('Content-Type', 'application/json');
    if (cookie) req.set('Cookie', cookie);
    return req;
  };
  return {
    get: (url: string) => withAuth(request(server).get(url)),
    post: (url: string) => withAuth(request(server).post(url)),
    put: (url: string) => withAuth(request(server).put(url)),
    patch: (url: string) => withAuth(request(server).patch(url)),
    delete: (url: string) => withAuth(request(server).delete(url)),
  };
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
