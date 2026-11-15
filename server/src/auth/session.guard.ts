import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { SESSION_COOKIE, SessionService } from './session.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const userId = await this.sessions.verify(request.cookies?.[SESSION_COOKIE]);
    if (!userId) throw new UnauthorizedException('Not signed in');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new UnauthorizedException('Not signed in');
    request.user = { id: user.id };
    return true;
  }
}
