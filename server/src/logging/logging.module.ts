import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpStatus, Module } from '@nestjs/common';
import type { Request } from 'express';
import { LoggerModule } from 'nestjs-pino';
import { EnvService } from '../common/env.service.js';

export const REQUEST_ID_HEADER = 'X-Request-Id';

const QUIET_PATHS = new Set(['/api/health', '/api/health/ready', '/api/metrics']);

function pathOf(url: string | undefined): string {
  return (url ?? '').split('?')[0] ?? '';
}

function levelFor(status: number, failed: boolean): 'info' | 'warn' | 'error' {
  if (failed || status >= HttpStatus.INTERNAL_SERVER_ERROR) return 'error';
  if (status >= HttpStatus.BAD_REQUEST) return 'warn';
  return 'info';
}

// Structured JSON logs (pino). Cookies, headers, query strings and bodies are never logged, so
// session tokens and recovery codes cannot leak into logs.
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        pinoHttp: {
          level: env.logLevel,
          transport:
            env.nodeEnv === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const id = randomUUID();
            res.setHeader(REQUEST_ID_HEADER, id);
            return id;
          },
          autoLogging: { ignore: (req: IncomingMessage) => QUIET_PATHS.has(pathOf(req.url)) },
          customLogLevel: (_req: IncomingMessage, res: ServerResponse, error?: Error) =>
            levelFor(res.statusCode, error !== undefined),
          customSuccessMessage: (req: IncomingMessage, res: ServerResponse) =>
            `${req.method} ${pathOf(req.url)} ${res.statusCode}`,
          customProps: (req: IncomingMessage) => ({ ip: (req as Request).ip }),
          serializers: {
            req: (req: { id: string; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: pathOf(req.url),
            }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          },
        },
      }),
    }),
  ],
})
export class LoggingModule {}
