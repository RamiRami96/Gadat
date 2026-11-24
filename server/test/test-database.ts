const SUFFIX = '_test';

// The e2e tests never touch the development database. They use TEST_DATABASE_URL when set,
// otherwise DATABASE_URL with "_test" added to the database name (gadat becomes gadat_test).
export function testDatabaseUrl(env: NodeJS.ProcessEnv): string {
  if (env.TEST_DATABASE_URL) return env.TEST_DATABASE_URL;
  if (!env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL or TEST_DATABASE_URL in server/.env to run the e2e tests.');
  }
  const url = new URL(env.DATABASE_URL);
  const name = decodeURIComponent(url.pathname.slice(1));
  url.pathname = `/${name.endsWith(SUFFIX) ? name : `${name}${SUFFIX}`}`;
  return url.toString();
}

export function databaseName(connectionString: string): string {
  return decodeURIComponent(new URL(connectionString).pathname.slice(1));
}
