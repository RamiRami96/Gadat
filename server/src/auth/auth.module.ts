import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ChallengeCookie } from './challenge.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService, SessionGuard, ChallengeCookie],
  exports: [SessionGuard, SessionService],
})
export class AuthModule {}
