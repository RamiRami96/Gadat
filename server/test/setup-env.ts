// Runs before every e2e file. DATABASE_URL comes from the environment or server/.env.
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Jest sandboxes `process`, so process.loadEnvFile() would not reach the app: parse the file ourselves.
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

// @nestjs/throttler is CommonJS and requires the ESM-only @nestjs/common. Jest can only do that when
// the ESM package is already fully loaded, so load it first.
await import('@nestjs/common');
await import('@nestjs/core');
