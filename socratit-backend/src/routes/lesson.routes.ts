// ============================================================================
// LESSON ROUTES
// API routes for class lesson management
// ============================================================================

import { Router } from 'express';
import multer from 'multer';
import {
  createLesson,
  getClassLessons,
  getClassLessonContext,
  getLessonById,
  updateLesson,
  deleteLesson,
} from '../controllers/lesson.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { requireClassAccess } from '../middleware/classAccess';
import { requireClassTeacher } from '../middleware/classOwnership';
import { asyncHandler } from '../middleware/errorHandler';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Configure multer for audio file uploads (memory storage, no disk write)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// Rate limiters
const lessonCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 100 : 20, // 100 dev, 20 prod
  message: 'Too many lesson creation attempts. Please try again later.',
});

// ============================================================================
// CLASS LESSON ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/classes/:classId/lessons
 * @desc    Create a new lesson with audio recording
 * @access  Teacher (must teach class)
 */
router.post(
  '/classes/:classId/lessons',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  lessonCreationLimiter,
  upload.single('audio'),
  asyncHandler(createLesson)
);

/**
 * @route   GET /api/v1/classes/:classId/lessons
 * @desc    Get all lessons for a class
 * @access  Teacher (must teach class) or Student (must be enrolled)
 */
router.get(
  '/classes/:classId/lessons',
  requireAuth,
  requireClassAccess,
  asyncHandler(getClassLessons)
);

/**
 * @route   GET /api/v1/classes/:classId/lessons/context
 * @desc    Get aggregated context from all lessons (for teachers)
 * @access  Teacher only
 */
router.get(
  '/classes/:classId/lessons/context',
  requireAuth,
  requireRole('TEACHER'),
  requireClassTeacher,
  asyncHandler(getClassLessonContext)
);

// ============================================================================
// INDIVIDUAL LESSON ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/lessons/:lessonId
 * @desc    Get a single lesson by ID
 * @access  Teacher or Student (must have access to the class)
 */
router.get(
  '/lessons/:lessonId',
  requireAuth,
  // Note: Access control is handled in the controller by checking class enrollment
  asyncHandler(getLessonById)
);

/**
 * @route   PATCH /api/v1/lessons/:lessonId
 * @desc    Update a lesson
 * @access  Teacher (must own the lesson)
 */
router.patch(
  '/lessons/:lessonId',
  requireAuth,
  requireRole('TEACHER'),
  // Note: Ownership is verified in the controller
  asyncHandler(updateLesson)
);

/**
 * @route   DELETE /api/v1/lessons/:lessonId
 * @desc    Delete a lesson
 * @access  Teacher (must own the lesson)
 */
router.delete(
  '/lessons/:lessonId',
  requireAuth,
  requireRole('TEACHER'),
  // Note: Ownership is verified in the controller
  asyncHandler(deleteLesson)
);

export default router;
