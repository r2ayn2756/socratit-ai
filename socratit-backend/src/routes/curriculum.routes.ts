// ============================================================================
// CURRICULUM ROUTES
// API endpoints for curriculum file management
// ============================================================================

import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/fileUpload';
import { validate } from '../middleware/validate';
import {
  uploadCurriculumSchema,
  updateCurriculumSchema,
  generateAssignmentSchema,
  listCurriculumSchema,
} from '../validators/curriculum.validator';
import {
  uploadCurriculum,
  getCurriculumStatus,
  triggerProcessing,
  listCurriculum,
  getCurriculum,
  updateCurriculum,
  deleteCurriculum,
  downloadCurriculum,
  generateAssignmentFromCurriculum,
  analyzeCurriculumPreview,
} from '../controllers/curriculum.controller';

const router = express.Router();

// ============================================================================
// APPLY AUTHENTICATION MIDDLEWARE
// All curriculum routes require authentication and teacher role
// ============================================================================

router.use(requireAuth);
router.use(requireRole('TEACHER'));

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/v1/curriculum/upload
 * Upload a curriculum file (PDF, DOCX, TXT, image)
 * Protected: Teacher only
 * Rate limited: 10 uploads per hour
 */
router.post(
  '/upload',
  upload.single('file'), // Multer middleware for file upload
  validate(uploadCurriculumSchema), // Validate title and description
  uploadCurriculum
);

/**
 * GET /api/v1/curriculum/:id/status
 * Get processing status for a curriculum material
 * Protected: Teacher only (must own the curriculum)
 */
router.get('/:id/status', getCurriculumStatus);

/**
 * POST /api/v1/curriculum/:id/process
 * Manually trigger processing for a curriculum material
 * Protected: Teacher only (must own the curriculum)
 */
router.post('/:id/process', triggerProcessing);

/**
 * GET /api/v1/curriculum
 * List curriculum materials for authenticated teacher
 * Protected: Teacher only
 * Query params: page, limit, fileType, processingStatus, isArchived, sortBy, sortOrder
 */
router.get('/', validate(listCurriculumSchema, 'query'), listCurriculum);

/**
 * GET /api/v1/curriculum/:id
 * Get a single curriculum material with full details
 * Protected: Teacher only (must own the curriculum)
 */
router.get('/:id', getCurriculum);

/**
 * PUT /api/v1/curriculum/:id
 * Update curriculum material metadata (title, description, etc.)
 * Protected: Teacher only (must own the curriculum)
 */
router.put('/:id', validate(updateCurriculumSchema), updateCurriculum);

/**
 * DELETE /api/v1/curriculum/:id
 * Delete a curriculum material (soft delete)
 * Protected: Teacher only (must own the curriculum)
 */
router.delete('/:id', deleteCurriculum);

/**
 * GET /api/v1/curriculum/:id/download
 * Download the original curriculum file
 * Protected: Teacher only (must own the curriculum)
 */
router.get('/:id/download', downloadCurriculum);

/**
 * POST /api/v1/curriculum/:id/generate-assignment
 * Generate an assignment from curriculum material
 * Protected: Teacher only (must own the curriculum and have access to class)
 * Rate limited: 10 generations per 15 minutes
 */
router.post('/:id/generate-assignment', validate(generateAssignmentSchema), generateAssignmentFromCurriculum);

/**
 * POST /api/v1/curriculum/analyze-preview
 * Analyze curriculum material with AI and return unit structure (preview mode)
 * Used during class creation wizard - does not create database records
 * Protected: Teacher only
 * Rate limited: 5 analyses per hour (AI intensive operation)
 */
router.post('/analyze-preview', analyzeCurriculumPreview);

export default router;
