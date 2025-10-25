// ============================================================================
// USER ROUTES
// Routes for user profile management
// ============================================================================

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', asyncHandler(getProfile));

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch(
  '/me',
  validate(updateProfileSchema),
  asyncHandler(updateProfile)
);

/**
 * @route   POST /api/v1/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  validate(changePasswordSchema),
  asyncHandler(changePassword)
);

export default router;
