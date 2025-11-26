// ============================================================================
// ENVIRONMENT CONFIGURATION
// Centralized environment variable management with validation
// ============================================================================

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvConfig {
  // Server
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  BACKEND_URL: string;

  // Database
  DATABASE_URL: string;

  // JWT
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;

  // Email
  EMAIL_FROM: string;
  EMAIL_PROVIDER: 'console' | 'ses';
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // Redis (Optional)
  REDIS_ENABLED: boolean;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;

  // Frontend
  FRONTEND_URL: string;

  // OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // AI Configuration
  AI_PROVIDER: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;

  // Anthropic (Backup)
  ANTHROPIC_API_KEY: string;
  CLAUDE_MODEL: string;

  // OpenAI (Legacy/Backup)
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;

  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_DIR: string;
  AWS_S3_BUCKET: string;

  // Security
  BCRYPT_ROUNDS: number;
  EMAIL_VERIFICATION_EXPIRY: number;
  PASSWORD_RESET_EXPIRY: number;

  // Compliance
  AUDIT_LOG_RETENTION_DAYS: number;
  UNVERIFIED_ACCOUNT_CLEANUP_DAYS: number;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value !== undefined) {
    return value; // Return the value even if it's an empty string
  }
  if (defaultValue !== undefined) {
    return defaultValue; // Return the default even if it's an empty string
  }
  throw new Error(`Missing required environment variable: ${key}`);
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
};

export const env: EnvConfig = {
  // Server
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', 3001),
  API_VERSION: getEnv('API_VERSION', 'v1'),
  BACKEND_URL: getEnv('BACKEND_URL', 'http://localhost:3001'),

  // Database
  DATABASE_URL: getEnv('DATABASE_URL'),

  // JWT
  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRY: getEnv('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: getEnv('JWT_REFRESH_EXPIRY', '7d'),

  // Email
  EMAIL_FROM: getEnv('EMAIL_FROM', 'noreply@socratit.ai'),
  EMAIL_PROVIDER: (getEnv('EMAIL_PROVIDER', 'console') as 'console' | 'ses'),
  AWS_REGION: getEnv('AWS_REGION', 'us-east-1'),
  AWS_ACCESS_KEY_ID: getEnv('AWS_ACCESS_KEY_ID', ''),
  AWS_SECRET_ACCESS_KEY: getEnv('AWS_SECRET_ACCESS_KEY', ''),

  // Redis (Optional)
  REDIS_ENABLED: getEnv('REDIS_ENABLED', 'false').toLowerCase() === 'true',
  REDIS_HOST: getEnv('REDIS_HOST', 'localhost'),
  REDIS_PORT: getEnvNumber('REDIS_PORT', 6379),
  REDIS_PASSWORD: getEnv('REDIS_PASSWORD', ''),

  // Frontend
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:3000'),

  // OAuth
  GOOGLE_CLIENT_ID: getEnv('GOOGLE_CLIENT_ID', ''),
  GOOGLE_CLIENT_SECRET: getEnv('GOOGLE_CLIENT_SECRET', ''),
  MICROSOFT_CLIENT_ID: getEnv('MICROSOFT_CLIENT_ID', ''),
  MICROSOFT_CLIENT_SECRET: getEnv('MICROSOFT_CLIENT_SECRET', ''),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),

  // AI Configuration
  AI_PROVIDER: getEnv('AI_PROVIDER', 'gemini'),
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY', ''),
  GEMINI_MODEL: getEnv('GEMINI_MODEL', 'gemini-2.0-flash-exp'),

  // Anthropic (Backup)
  ANTHROPIC_API_KEY: getEnv('ANTHROPIC_API_KEY', ''),
  CLAUDE_MODEL: getEnv('CLAUDE_MODEL', 'claude-3-haiku-20240307'),

  // OpenAI (Legacy/Backup)
  OPENAI_API_KEY: getEnv('OPENAI_API_KEY', ''),
  OPENAI_MODEL: getEnv('OPENAI_MODEL', 'gpt-3.5-turbo'),

  // File Upload
  MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 104857600), // 100MB default (increased from 10MB)
  UPLOAD_DIR: getEnv('UPLOAD_DIR', './uploads'),
  AWS_S3_BUCKET: getEnv('AWS_S3_BUCKET', ''),

  // Security
  BCRYPT_ROUNDS: getEnvNumber('BCRYPT_ROUNDS', 12),
  EMAIL_VERIFICATION_EXPIRY: getEnvNumber('EMAIL_VERIFICATION_EXPIRY', 3600000),
  PASSWORD_RESET_EXPIRY: getEnvNumber('PASSWORD_RESET_EXPIRY', 3600000),

  // Compliance
  AUDIT_LOG_RETENTION_DAYS: getEnvNumber('AUDIT_LOG_RETENTION_DAYS', 2555),
  UNVERIFIED_ACCOUNT_CLEANUP_DAYS: getEnvNumber('UNVERIFIED_ACCOUNT_CLEANUP_DAYS', 7),
};

// Validate critical environment variables on startup
export const validateEnv = (): void => {
  if (env.NODE_ENV === 'production') {
    if (env.JWT_ACCESS_SECRET.includes('change-this') || env.JWT_ACCESS_SECRET.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be changed in production and be at least 32 characters');
    }
    if (env.JWT_REFRESH_SECRET.includes('change-this') || env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be changed in production and be at least 32 characters');
    }
  }

  console.log('✅ Environment variables validated successfully');
};
