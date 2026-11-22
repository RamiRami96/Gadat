import { createHash, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { EnvService } from '../common/env.service.js';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

// /api/metrics exposes internals, so it needs a bearer token. Without METRICS_TOKEN it is off.
@Injectable()
export class MetricsTokenGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}

  public canActivate(context: ExecutionContext): boolean {
    const expected = this.env.metricsToken;
    if (!expected) throw new NotFoundException();
    const header = context.switchToHttp().getRequest<Request>().headers.authorization ?? '';
    const [scheme, token = ''] = header.split(' ');
    if (scheme !== 'Bearer' || !timingSafeEqual(digest(token), digest(expected))) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
