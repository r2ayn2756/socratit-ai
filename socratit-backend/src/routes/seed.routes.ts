// ============================================================================
// SEED ROUTES
// One-time endpoint to seed database
// ============================================================================

import { Router } from 'express';
import { seedDatabase } from '../controllers/seed.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route   GET /api/v1/seed
 * @desc    Seed database with initial data
 * @access  Public (should be removed or protected in production)
 */
router.get('/', asyncHandler(seedDatabase));

export default router;
