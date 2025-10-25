// ============================================================================
// FILE UPLOAD MIDDLEWARE
// Handles file uploads with validation and security checks
// ============================================================================

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';
import { env } from '../config/env';
import FileType from 'file-type';

// ============================================================================
// ALLOWED FILE TYPES
// ============================================================================

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain',
  'image/jpeg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png'];

// ============================================================================
// MULTER STORAGE CONFIGURATION
// ============================================================================

const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      // Extract user info from request (set by requireAuth middleware)
      const userId = (req as any).user?.userId;
      const schoolId = (req as any).user?.schoolId;

      if (!userId || !schoolId) {
        return cb(new Error('Unauthorized: User information missing'), '');
      }

      // Create directory structure: uploads/{schoolId}/{userId}
      const uploadPath = path.join(env.UPLOAD_DIR, schoolId, userId);

      // Ensure directory exists
      await fs.mkdir(uploadPath, { recursive: true });

      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },

  filename: (_req, file, cb) => {
    // Generate unique filename: {timestamp}-{uuid}.{ext}
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

// ============================================================================
// FILE FILTER
// Validates file type before upload
// ============================================================================

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid MIME type: ${file.mimetype}`));
  }

  cb(null, true);
};

// ============================================================================
// MULTER INSTANCE
// ============================================================================

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE, // Default: 10MB
    files: 1, // Only allow 1 file per upload
  },
});

// ============================================================================
// VALIDATE FILE CONTENT (Magic Number Check)
// Prevents file type spoofing by checking actual file content
// ============================================================================

export async function validateFileContent(filePath: string, declaredMimeType: string): Promise<boolean> {
  try {
    // Read first 4100 bytes for file type detection
    const buffer = await fs.readFile(filePath);
    const fileType = await FileType.fromBuffer(buffer);

    if (!fileType) {
      // file-type couldn't detect type (might be plain text)
      if (declaredMimeType === 'text/plain') {
        return true; // Allow plain text files
      }
      return false;
    }

    // Map detected MIME type to allowed types
    const allowedDetectedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/png',
    ];

    return allowedDetectedTypes.includes(fileType.mime);
  } catch (error) {
    console.error('File content validation error:', error);
    return false;
  }
}

// ============================================================================
// CLEANUP TEMPORARY FILE
// Removes file if validation fails
// ============================================================================

export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    console.log(`Cleaned up file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error);
  }
}

// ============================================================================
// GET FILE EXTENSION FROM MIME TYPE
// ============================================================================

export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'text/plain': 'txt',
    'image/jpeg': 'jpg',
    'image/png': 'png',
  };

  return mimeToExt[mimeType] || 'unknown';
}
