import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import pg from 'pg';
import { databaseName, testDatabaseUrl } from './test-database.js';

// Creates the e2e database if it is missing and brings it up to date with the migrations.
if (existsSync('.env')) {
  Object.entries(parseEnv(readFileSync('.env', 'utf8'))).forEach(([key, value]) => {
    process.env[key] ??= value;
  });
}

const url = testDatabaseUrl(process.env);
const name = databaseName(url);
if (!name.endsWith('_test')) {
  throw new Error(`Refusing to prepare "${name}": the e2e database name must end in "_test".`);
}

const admin = new URL(url);
admin.pathname = '/postgres';
const client = new pg.Client({ connectionString: admin.toString() });
await client.connect();
try {
  const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
  if (found.rowCount === 0) {
    await client.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`);
    console.log(`Created database ${name}`);
  }
} finally {
  await client.end();
}

execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});
