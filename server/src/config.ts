import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

export type AppEnvironment = 'local' | 'staging' | 'production';

function resolveAppEnv(): AppEnvironment {
  if (process.env.APP_ENV) {
    const env = process.env.APP_ENV.toLowerCase().trim();
    if (env === 'staging' || env === 'stage') return 'staging';
    if (env === 'production' || env === 'prod') return 'production';
    return 'local';
  }
  if (process.env.NODE_ENV === 'development') {
    return 'local';
  }
  const frontendUrl = (process.env.FRONTEND_BASE_URL || process.env.APP_BASE_URL || '').toLowerCase();
  if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
    return 'local';
  }
  return process.env.NODE_ENV === 'production' ? 'production' : 'local';
}

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'production',
  APP_ENV: resolveAppEnv(),
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required.');
  })(),
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || '20rashad21@gmail.com').trim().toLowerCase(),
  ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD || (() => {
    throw new Error('CRITICAL SECURITY ERROR: ADMIN_INITIAL_PASSWORD environment variable is required.');
  })(),
  FRONTEND_BASE_URL: (process.env.FRONTEND_BASE_URL || process.env.APP_BASE_URL || '').trim(),
};
