import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { EnvService } from './common/env.service.js';

export function configureApp(app: INestApplication): void {
  const env = app.get(EnvService);
  const express = app as NestExpressApplication;
  if (env.trustProxy > 0) express.set('trust proxy', env.trustProxy);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser(env.cookieSecret));
  app.enableCors({
    origin: env.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
