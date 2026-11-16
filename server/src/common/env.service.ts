import { Injectable } from '@nestjs/common';

const PLACEHOLDER = 'change-me';

function required(name: string, source: NodeJS.ProcessEnv): string {
  const value = source[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See server/.env.example.`);
  }
  return value;
}

@Injectable()
export class EnvService {
  readonly nodeEnv: string;

  readonly isProduction: boolean;

  readonly port: number;

  readonly cookieSecret: string;

  readonly rpId: string;

  readonly rpName: string;

  readonly origin: string;

  readonly trustProxy: number;

  constructor(source: NodeJS.ProcessEnv = process.env) {
    this.nodeEnv = source.NODE_ENV ?? 'development';
    this.isProduction = this.nodeEnv === 'production';
    this.port = Number(source.PORT ?? 3000);
    this.cookieSecret = required('COOKIE_SECRET', source);
    this.rpId = required('RP_ID', source);
    this.rpName = source.RP_NAME ?? 'Gӓdӓt';
    this.origin = required('ORIGIN', source);
    this.trustProxy = Number(source.TRUST_PROXY ?? 0);
    required('DATABASE_URL', source);

    if (this.isProduction) {
      if (this.cookieSecret.startsWith(PLACEHOLDER) || this.cookieSecret.length < 32) {
        throw new Error(
          'COOKIE_SECRET must be a random string of at least 32 characters in production.',
        );
      }
    }
  }
}
