import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

if (existsSync('.env')) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync('.env', 'utf8')))) {
    process.env[key] ??= value;
  }
}
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'e2e-jwt-secret-e2e-jwt-secret-e2e';
process.env.COOKIE_SECRET ??= 'e2e-cookie-secret-e2e-cookie-secret';
process.env.RP_ID ??= 'localhost';
process.env.ORIGIN ??= 'http://localhost:4200';

await import('@nestjs/common');
await import('@nestjs/core');
