import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { Request } from 'express';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** CSRF defence in depth: mutating requests must declare application/json. */
@Injectable()
export class JsonContentTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!MUTATING.has(request.method)) return true;
    const type = (request.headers['content-type'] ?? '').split(';')[0]?.trim().toLowerCase();
    if (type !== 'application/json') {
      throw new UnsupportedMediaTypeException('Content-Type must be application/json');
    }
    return true;
  }
}
