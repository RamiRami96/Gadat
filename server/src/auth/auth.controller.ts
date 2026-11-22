import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser, SessionUser } from '../common/current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { ChallengeCookie, ChallengeKind, ChallengeState } from './challenge.js';
import { RecoveryDto, WebAuthnResponseDto } from './dto/auth.dto.js';
import { SessionGuard } from './session.guard.js';
import { SESSION_COOKIE, SessionService } from './session.service.js';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly challenges: ChallengeCookie,
  ) {}

  private takeChallenge(req: Request, res: Response, kind: ChallengeKind): ChallengeState {
    const state = this.challenges.take(req, res, kind);
    if (!state) throw new BadRequestException('The fingerprint request expired. Please try again.');
    return state;
  }

  @Post('register/options')
  @HttpCode(200)
  public async registerOptions(@Res({ passthrough: true }) res: Response) {
    const { options, state } = await this.auth.startRegistration();
    this.challenges.set(res, state);
    return options;
  }

  @Post('register/verify')
  @HttpCode(200)
  public async registerVerify(
    @Body() body: WebAuthnResponseDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const state = this.takeChallenge(req, res, 'register');
    const { userId, recoveryCode } = await this.auth.finishRegistration(state, body.response);
    await this.sessions.start(res, userId);
    return { recoveryCode };
  }

  @Post('login/options')
  @HttpCode(200)
  public async loginOptions(@Res({ passthrough: true }) res: Response) {
    const { options, state } = await this.auth.startLogin();
    this.challenges.set(res, state);
    return options;
  }

  @Post('login/verify')
  @HttpCode(200)
  public async loginVerify(
    @Body() body: WebAuthnResponseDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const state = this.takeChallenge(req, res, 'login');
    const { userId } = await this.auth.finishLogin(state, body.response);
    await this.sessions.start(res, userId);
    return { id: userId };
  }

  @Post('recovery')
  @HttpCode(200)
  public async recovery(@Body() body: RecoveryDto, @Res({ passthrough: true }) res: Response) {
    const { userId, recoveryCode } = await this.auth.useRecoveryCode(body.code);
    await this.sessions.start(res, userId);
    return { recoveryCode };
  }

  @Post('credentials/options')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  public async credentialOptions(
    @CurrentUser() user: SessionUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { options, state } = await this.auth.startAddCredential(user.id);
    this.challenges.set(res, state);
    return options;
  }

  @Post('credentials/verify')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  public async credentialVerify(
    @CurrentUser() user: SessionUser,
    @Body() body: WebAuthnResponseDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const state = this.takeChallenge(req, res, 'add');
    await this.auth.finishAddCredential(user.id, state, body.response);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  public me(@CurrentUser() user: SessionUser) {
    return { id: user.id };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.sessions.end(res, req.cookies?.[SESSION_COOKIE]);
  }
}
