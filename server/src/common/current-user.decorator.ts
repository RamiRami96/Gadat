import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export class SessionUser {
  public id: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: SessionUser }>();
    return request.user;
  },
);
