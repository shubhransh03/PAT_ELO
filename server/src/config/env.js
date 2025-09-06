import { cleanEnv, str, num, bool } from 'envalid';
import dotenv from 'dotenv';
// Load .env before reading variables
dotenv.config();

// Validate and normalize base env at startup
export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: num({ default: 4000 }),
  MONGODB_URI: str({ default: '' }),
  CLERK_SECRET_KEY: str({ default: '' }),
  CORS_ORIGIN: str({ default: 'http://localhost:5173' }),
  ENABLE_API_DOCS: bool({ default: false }),
  SKIP_DB: bool({ default: false }),
  SKIP_AUTH: bool({ default: false }),
});

export const isProd = () => env.NODE_ENV === 'production';

// Dynamic flags so tests can toggle process.env at runtime
export const skipDb = () => !isProd() && (((process.env.SKIP_DB || '').toLowerCase() === 'true') || process.env.SKIP_DB === '1' || env.SKIP_DB === true);
export const skipAuth = () => !isProd() && (((process.env.SKIP_AUTH || '').toLowerCase() === 'true') || process.env.SKIP_AUTH === '1' || env.SKIP_AUTH === true);

export const corsOrigins = () => {
  const def = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const raw = process.env.CORS_ORIGIN || env.CORS_ORIGIN || '';
  const arr = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : def;
  return arr;
};

// Hard guards for production
if (isProd()) {
  if (env.SKIP_DB) {
    throw new Error('SKIP_DB must not be enabled in production');
  }
  if (env.SKIP_AUTH) {
    throw new Error('SKIP_AUTH must not be enabled in production');
  }
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production');
  }
  if (!env.CLERK_SECRET_KEY) {
    // Not throwing to allow alt auth in future, but strongly warn by console
    console.warn('CLERK_SECRET_KEY is not set in production. Authentication may fail.');
  }
}
