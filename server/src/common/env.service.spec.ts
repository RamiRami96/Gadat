import { describe, expect, it } from '@jest/globals';
import { EnvService } from './env.service.js';

const SECRET = 'a'.repeat(40);

function make(overrides: NodeJS.ProcessEnv = {}): EnvService {
  return new EnvService({
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    COOKIE_SECRET: SECRET,
    RP_ID: 'localhost',
    ORIGIN: 'http://localhost:4200',
    NODE_ENV: 'production',
    ...overrides,
  });
}

describe('EnvService', () => {
  it('fills in defaults', () => {
    const env = make();
    expect(env.port).toBe(3000);
    expect(env.trustProxy).toBe(0);
    expect(env.metricsToken).toBeUndefined();
  });

  it('treats anything but development and test as production', () => {
    expect(make({ NODE_ENV: undefined }).isProduction).toBe(true);
    expect(make({ NODE_ENV: 'staging' }).isProduction).toBe(true);
    expect(make({ NODE_ENV: 'development' }).isProduction).toBe(false);
  });

  it('requires the core variables', () => {
    expect(() => make({ DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
    expect(() => make({ ORIGIN: undefined })).toThrow(/ORIGIN/);
  });

  it('rejects a PORT or TRUST_PROXY that is not a whole number in range', () => {
    expect(make({ PORT: '8080' }).port).toBe(8080);
    expect(() => make({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => make({ PORT: '0' })).toThrow(/PORT/);
    expect(() => make({ PORT: '70000' })).toThrow(/PORT/);
    expect(() => make({ PORT: '30.5' })).toThrow(/PORT/);
    expect(make({ TRUST_PROXY: '1' }).trustProxy).toBe(1);
    expect(() => make({ TRUST_PROXY: 'yes' })).toThrow(/TRUST_PROXY/);
  });

  it('rejects a weak or placeholder COOKIE_SECRET in production only', () => {
    expect(() => make({ COOKIE_SECRET: 'short' })).toThrow(/COOKIE_SECRET/);
    expect(() => make({ COOKIE_SECRET: `change-me-${SECRET}` })).toThrow(/COOKIE_SECRET/);
    expect(make({ COOKIE_SECRET: 'short', NODE_ENV: 'development' }).isProduction).toBe(false);
  });

  it('rejects a weak or placeholder METRICS_TOKEN in production only', () => {
    expect(() => make({ METRICS_TOKEN: 'short' })).toThrow(/METRICS_TOKEN/);
    expect(() => make({ METRICS_TOKEN: `dev-metrics-token-${SECRET}` })).toThrow(/METRICS_TOKEN/);
    expect(make({ METRICS_TOKEN: SECRET }).metricsToken).toBe(SECRET);
    expect(make({ METRICS_TOKEN: 'dev-token', NODE_ENV: 'development' }).metricsToken).toBe(
      'dev-token',
    );
  });
});
