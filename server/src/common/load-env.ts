// Imported first in main.ts so that variables from .env exist before any other module reads them.
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on variables already present in the environment.
}
