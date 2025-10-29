// ============================================================================
// UPLOAD ROUTES
// File upload endpoints for curriculum materials
// ============================================================================

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadCurriculumFile, getCurriculumFile } from '../controllers/upload.controller';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/curriculum');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept pdf, doc, docx files only
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/upload/curriculum
 * Upload curriculum file
 * @auth Required - TEACHER role
 */
router.post(
  '/curriculum',
  authenticate,
  requireRole('TEACHER'),
  upload.single('file'),
  uploadCurriculumFile
);

/**
 * GET /api/upload/curriculum/:fileId
 * Download curriculum file
 * @auth Required - TEACHER or STUDENT role
 */
router.get(
  '/curriculum/:fileId',
  authenticate,
  getCurriculumFile
);

export default router;
