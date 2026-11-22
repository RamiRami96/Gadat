import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { SESSION_COOKIE, SessionService } from './session.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const userId = await this.sessions.verify(request.cookies?.[SESSION_COOKIE]);
    if (!userId) throw new UnauthorizedException('Not signed in');
    request.user = { id: userId };
    return true;
  }
}
