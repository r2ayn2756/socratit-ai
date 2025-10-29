// ============================================================================
// UPLOAD CONTROLLER
// Handles file upload and retrieval
// ============================================================================

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { processCurriculumFile } from '../services/fileProcessing.service';

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

    // Process file immediately (synchronously for now - extract text)
    // This ensures text is available for AI generation
    console.log(`📄 Processing uploaded file: ${fileRecord.id}`);
    const processingResult = await processCurriculumFile(fileRecord.id);

    if (!processingResult.success) {
      console.error(`❌ File processing failed: ${processingResult.error}`);
      // Still return success for upload, but indicate processing failed
      res.status(201).json({
        success: true,
        message: 'File uploaded but processing failed',
        data: {
          id: fileRecord.id,
          title: fileRecord.title,
          fileName: fileRecord.originalFileName,
          fileType: fileRecord.fileType,
          fileSize: fileRecord.fileSize,
          uploadedAt: fileRecord.createdAt,
          processingStatus: 'failed',
          error: processingResult.error,
        },
      });
      return;
    }

    console.log(`✅ File processed successfully`);

    res.status(201).json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: {
        id: fileRecord.id,
        title: fileRecord.title,
        fileName: fileRecord.originalFileName,
        fileType: fileRecord.fileType,
        fileSize: fileRecord.fileSize,
        uploadedAt: fileRecord.createdAt,
        processingStatus: 'completed',
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

/**
 * Get curriculum file processing status
 * GET /api/upload/curriculum/:fileId/status
 */
export async function getCurriculumFileStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fileId } = req.params;

    const fileRecord = await prisma.curriculumMaterial.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        title: true,
        originalFileName: true,
        fileType: true,
        fileSize: true,
        processingStatus: true,
        textExtractionError: true,
        createdAt: true,
        processingCompletedAt: true,
        schoolId: true,
      },
    });

    if (!fileRecord) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // Check access
    if (fileRecord.schoolId !== req.user!.schoolId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: fileRecord,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Manually trigger file processing
 * POST /api/upload/curriculum/:fileId/process
 */
export async function processCurriculumFileManually(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fileId } = req.params;

    // Check file exists and user has access
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

    if (fileRecord.schoolId !== req.user!.schoolId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Process file
    const result = await processCurriculumFile(fileId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'File processing failed',
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'File processed successfully',
      data: {
        processingStatus: 'completed',
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  uploadCurriculumFile,
  getCurriculumFile,
  getCurriculumFileStatus,
  processCurriculumFileManually,
};
