import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on variables already present in the environment.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
