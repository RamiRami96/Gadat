import { Injectable } from '@nestjs/common';

const PLACEHOLDER = 'change-me';
const METRICS_PLACEHOLDER = 'dev-';
const MIN_SECRET_LENGTH = 32;
const RELAXED_ENVS = new Set(['development', 'test']);

function required(name: string, source: NodeJS.ProcessEnv): string {
  const value = source[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See server/.env.example.`);
  }
  return value;
}

function integer(
  name: string,
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be a whole number from ${min} to ${max}, got "${raw}".`);
  }
  return value;
}

@Injectable()
export class EnvService {
  public readonly nodeEnv: string;

  public readonly isProduction: boolean;

  public readonly port: number;

  public readonly cookieSecret: string;

  public readonly rpId: string;

  public readonly rpName: string;

  public readonly origin: string;

  public readonly trustProxy: number;

  public readonly logLevel: string;

  public readonly metricsToken: string | undefined;

  constructor(source: NodeJS.ProcessEnv = process.env) {
    // Fail closed: only an explicit development/test value relaxes the production safeguards.
    this.nodeEnv = source.NODE_ENV ?? 'production';
    this.isProduction = !RELAXED_ENVS.has(this.nodeEnv);
    this.port = integer('PORT', source.PORT, 3000, 1, 65535);
    this.cookieSecret = required('COOKIE_SECRET', source);
    this.rpId = required('RP_ID', source);
    this.rpName = source.RP_NAME ?? 'Gӓdӓt';
    this.origin = required('ORIGIN', source);
    this.trustProxy = integer('TRUST_PROXY', source.TRUST_PROXY, 0, 0, 10);
    this.logLevel = source.LOG_LEVEL ?? (this.nodeEnv === 'test' ? 'silent' : 'info');
    this.metricsToken = source.METRICS_TOKEN || undefined;
    required('DATABASE_URL', source);

    if (this.isProduction) {
      if (
        this.cookieSecret.startsWith(PLACEHOLDER) ||
        this.cookieSecret.length < MIN_SECRET_LENGTH
      ) {
        throw new Error(
          'COOKIE_SECRET must be a random string of at least 32 characters in production.',
        );
      }
      if (
        this.metricsToken !== undefined &&
        (this.metricsToken.startsWith(METRICS_PLACEHOLDER) ||
          this.metricsToken.length < MIN_SECRET_LENGTH)
      ) {
        throw new Error(
          'METRICS_TOKEN must be a random string of at least 32 characters in production ' +
            '(or unset to disable /api/metrics).',
        );
      }
    }
  }
}
