// ============================================================================
// UPLOAD CONTROLLER
// Handles file upload and retrieval
// ============================================================================

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Upload curriculum file
 * POST /api/upload/curriculum
 */
export async function uploadCurriculumFile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;

    // Determine file type from extension
    const ext = originalname.split('.').pop()?.toLowerCase() || '';
    const fileType = ext === 'pdf' ? 'pdf' : ext === 'docx' || ext === 'doc' ? 'docx' : 'txt';

    // Create file record in database
    const fileRecord = await prisma.curriculumMaterial.create({
      data: {
        title: originalname.replace(/\.[^/.]+$/, ''), // Filename without extension
        originalFileName: originalname,
        fileType,
        mimeType: mimetype,
        fileSize: size,
        filePath: filename, // Store just the filename, not full path
        schoolId: req.user!.schoolId,
        teacherId: req.user!.id,
        processingStatus: 'pending',
      },
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: fileRecord.id,
        title: fileRecord.title,
        fileName: fileRecord.originalFileName,
        fileType: fileRecord.fileType,
        fileSize: fileRecord.fileSize,
        uploadedAt: fileRecord.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get curriculum file
 * GET /api/upload/curriculum/:fileId
 */
export async function getCurriculumFile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fileId } = req.params;

    // Get file record from database
    const fileRecord = await prisma.curriculumMaterial.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // Check access - must be from same school
    if (fileRecord.schoolId !== req.user!.schoolId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Build file path
    const uploadsDir = path.join(__dirname, '../../uploads/curriculum');
    const filePath = path.join(uploadsDir, fileRecord.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'File not found on disk',
      });
      return;
    }

    // Send file
    res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalFileName}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

export default {
  uploadCurriculumFile,
  getCurriculumFile,
};
