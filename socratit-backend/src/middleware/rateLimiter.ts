// ============================================================================
// RATE LIMITING MIDDLEWARE
// Prevents abuse by limiting requests per time window
// ============================================================================

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * General API rate limiter
 * Development: Relaxed limits (1000 requests/15min) for testing
 * Production: Strict limits (100 requests/15min) for security
 *
 * Auto-disabled in development when RATE_LIMIT_MAX_REQUESTS >= 1000
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // CRITICAL: Configure for Railway/cloud proxy
  validate: { trustProxy: false },  // Disable trust proxy validation
  // Skip rate limiting in development if limits are very high (>= 1000)
  skip: (req) => {
    return env.NODE_ENV === 'development' && env.RATE_LIMIT_MAX_REQUESTS >= 1000;
  },
});

/**
 * Strict rate limiter for auth endpoints
 * DEVELOPMENT: Disabled for local testing
 * PRODUCTION: 20 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased from 5 to 20 for better UX during testing
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },  // Disable trust proxy validation
  skipSuccessfulRequests: true, // Don't count successful requests
  // CRITICAL: Skip rate limiting entirely in development mode for testing
  skip: (req) => {
    return env.NODE_ENV === 'development';
  },
});

/**
 * Password reset rate limiter
 * DEVELOPMENT: Disabled for local testing
 * PRODUCTION: 10 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Increased from 3 to 10
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },  // Disable trust proxy validation
  // Skip rate limiting in development mode
  skip: (req) => {
    return env.NODE_ENV === 'development';
  },
});

/**
 * Email verification rate limiter
 * DEVELOPMENT: Disabled for local testing
 * PRODUCTION: 5 requests per hour per IP
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many verification attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },  // Disable trust proxy validation
  // Skip rate limiting in development mode
  skip: (req) => {
    return env.NODE_ENV === 'development';
  },
});

/**
 * Generic rate limiter factory
 * Create custom rate limiters with specified options
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },  // Disable trust proxy validation
  });
};
