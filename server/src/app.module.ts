import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthModule } from './auth/auth.module.js';
import { CheckInsModule } from './check-ins/check-ins.module.js';
import { CommonModule } from './common/common.module.js';
import { JsonContentTypeGuard } from './common/json-content-type.guard.js';
import { ExportModule } from './export/export.module.js';
import { HabitsModule } from './habits/habits.module.js';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

function scopedKey(context: ExecutionContext, tracker: string): string {
  const request = context.switchToHttp().getRequest<Request>();
  const scope = request.path.startsWith('/api/auth') ? 'auth' : 'api';
  return `${scope}:${tracker}`;
}

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      generateKey: scopedKey,
    }),
    AuthModule,
    HabitsModule,
    CheckInsModule,
    ExportModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JsonContentTypeGuard },
  ],
})
export class AppModule {}
