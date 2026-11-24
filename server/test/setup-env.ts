import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { testDatabaseUrl } from './test-database.js';

if (existsSync('.env')) {
  Object.entries(parseEnv(readFileSync('.env', 'utf8'))).forEach(([key, value]) => {
    process.env[key] ??= value;
  });
}
process.env.DATABASE_URL = testDatabaseUrl(process.env);
process.env.NODE_ENV = 'test';
process.env.METRICS_TOKEN = 'e2e-metrics-token';
process.env.COOKIE_SECRET ??= 'e2e-cookie-secret-e2e-cookie-secret';
process.env.RP_ID ??= 'localhost';
process.env.ORIGIN ??= 'http://localhost:4200';

await import('@nestjs/common');
await import('@nestjs/core');
