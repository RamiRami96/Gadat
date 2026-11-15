import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EnvService } from '../common/env.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ChallengeCookie } from './challenge.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (env: EnvService) => ({ secret: env.jwtSecret }),
      inject: [EnvService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionService, SessionGuard, ChallengeCookie],
  exports: [SessionGuard, SessionService],
})
export class AuthModule {}
