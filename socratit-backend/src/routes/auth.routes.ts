// ============================================================================
// AUTH ROUTES
// Routes for authentication and user management
// ============================================================================

import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  // authLimiter, // DISABLED FOR TESTING
  validate(registerSchema),
  asyncHandler(register)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  // authLimiter, // DISABLED FOR TESTING
  validate(loginSchema),
  asyncHandler(login)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(refreshToken)
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify user email address
 * @access  Public
 */
router.post(
  '/verify-email',
  emailVerificationLimiter,
  validate(verifyEmailSchema),
  asyncHandler(verifyEmail)
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(forgotPassword)
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  asyncHandler(resetPassword)
);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  requireAuth,
  validate(logoutSchema),
  asyncHandler(logout)
);

export default router;
