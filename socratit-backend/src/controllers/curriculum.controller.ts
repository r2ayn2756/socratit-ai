// ============================================================================
// CURRICULUM CONTROLLER
// Handles curriculum file upload, processing, and management endpoints
// ============================================================================

import { Request, Response } from 'express';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import {
  createCurriculumMaterial,
  processCurriculumFile,
  listCurriculumMaterials,
  getCurriculumMaterial,
  updateCurriculumMaterial,
  deleteCurriculumMaterial,
  getCurriculumFilePath,
} from '../services/curriculum.service';
import { generateQuizFromCurriculum } from '../services/ai.service';
import { cleanupFile, validateFileContent, getFileExtension } from '../middleware/fileUpload';
import { createFileUploadLog } from '../services/fileLog.service';
import { createAuditLog } from '../utils/audit';

const prisma = new PrismaClient();

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * POST /api/v1/curriculum/upload
 * Uploads a curriculum file
 */
export async function uploadCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    // Validate file content (magic number check)
    const isValidContent = await validateFileContent(file.path, file.mimetype);
    if (!isValidContent) {
      await cleanupFile(file.path);
      res.status(400).json({
        success: false,
        message: 'Invalid file content. File type does not match its content.',
      });
      return;
    }

    // Determine file type
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    const fileType = getFileExtension(file.mimetype) || fileExt;

    // Create curriculum material record
    const curriculum = await createCurriculumMaterial({
      userId,
      schoolId,
      title,
      description,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      fileType,
      mimeType: file.mimetype,
      ipAddress: req.ip || '0.0.0.0',
      userAgent: req.get('user-agent'),
    });

    // Log audit action
    await createAuditLog({
      userId,
      schoolId,
      action: 'UPLOAD_CURRICULUM',
      resourceType: 'curriculum_material',
      resourceId: curriculum.id,
      ipAddress: req.ip || '0.0.0.0',
      userAgent: req.get('user-agent'),
      metadata: {
        fileName: file.originalname,
        fileSize: file.size,
        fileType,
      },
    });

    // Automatically trigger processing in the background
    // (don't await - let it process asynchronously)
    processCurriculumFile(curriculum.id, userId, schoolId).catch((error) => {
      console.error('Background processing error:', error);
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully. Processing started.',
      data: {
        id: curriculum.id,
        title: curriculum.title,
        description: curriculum.description,
        fileName: curriculum.originalFileName,
        fileType: curriculum.fileType,
        fileSize: curriculum.fileSize,
        processingStatus: curriculum.processingStatus,
        createdAt: curriculum.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Upload curriculum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload curriculum',
      errors: [error.message],
    });
  }
}

// ============================================================================
// PROCESSING STATUS
// ============================================================================

/**
 * GET /api/v1/curriculum/:id/status
 * Gets processing status for a curriculum material
 */
export async function getCurriculumStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const { id } = req.params;

    const curriculum = await prisma.curriculumMaterial.findFirst({
      where: {
        id,
        teacherId: userId,
        schoolId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        processingStatus: true,
        extractedText: true,
        textExtractionError: true,
        aiSummary: true,
        processingStartedAt: true,
        processingCompletedAt: true,
      },
    });

    if (!curriculum) {
      res.status(404).json({
        success: false,
        message: 'Curriculum material not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: curriculum.id,
        title: curriculum.title,
        status: curriculum.processingStatus,
        hasExtractedText: !!curriculum.extractedText,
        error: curriculum.textExtractionError,
        processingStartedAt: curriculum.processingStartedAt,
        processingCompletedAt: curriculum.processingCompletedAt,
      },
    });
  } catch (error: any) {
    console.error('Get curriculum status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get processing status',
      errors: [error.message],
    });
  }
}

// ============================================================================
// MANUAL PROCESSING TRIGGER
// ============================================================================

/**
 * POST /api/v1/curriculum/:id/process
 * Manually triggers processing for a curriculum material
 */
export async function triggerProcessing(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const { id } = req.params;

    // Trigger processing
    const result = await processCurriculumFile(id, userId, schoolId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Curriculum processed successfully',
        data: {
          extractedTextLength: result.extractedText?.length || 0,
          processingTime: result.processingTime,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Processing failed',
        errors: [result.error || 'Unknown error'],
      });
    }
  } catch (error: any) {
    console.error('Trigger processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process curriculum',
      errors: [error.message],
    });
  }
}

// ============================================================================
// LIST CURRICULUM
// ============================================================================

/**
 * GET /api/v1/curriculum
 * Lists curriculum materials for the authenticated teacher
 */
export async function listCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const {
      page = 1,
      limit = 20,
      fileType,
      processingStatus,
      isArchived,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await listCurriculumMaterials(userId, schoolId, {
      page: Number(page),
      limit: Number(limit),
      fileType: fileType as string,
      processingStatus: processingStatus as string,
      isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({
      success: true,
      data: result.materials,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('List curriculum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list curriculum materials',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GET SINGLE CURRICULUM
// ============================================================================

/**
 * GET /api/v1/curriculum/:id
 * Gets a single curriculum material with full details
 */
export async function getCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const { id } = req.params;

    const curriculum = await getCurriculumMaterial(id, userId, schoolId);

    res.json({
      success: true,
      data: curriculum,
    });
  } catch (error: any) {
    console.error('Get curriculum error:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get curriculum material',
      errors: [error.message],
    });
  }
}

// ============================================================================
// UPDATE CURRICULUM
// ============================================================================

/**
 * PUT /api/v1/curriculum/:id
 * Updates curriculum material metadata
 */
export async function updateCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const { id } = req.params;
    const { title, description, aiSummary, aiOutline, isArchived } = req.body;

    const updated = await updateCurriculumMaterial(id, userId, schoolId, {
      title,
      description,
      aiSummary,
      aiOutline,
      isArchived,
    });

    // Log audit action
    await createAuditLog({
      userId,
      schoolId,
      action: 'PROCESS_CURRICULUM',
      resourceType: 'curriculum_material',
      resourceId: id,
      ipAddress: req.ip || '0.0.0.0',
      userAgent: req.get('user-agent'),
      metadata: { updatedFields: Object.keys(req.body) },
    });

    res.json({
      success: true,
      message: 'Curriculum updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Update curriculum error:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update curriculum',
      errors: [error.message],
    });
  }
}

// ============================================================================
// DELETE CURRICULUM
// ============================================================================

/**
 * DELETE /api/v1/curriculum/:id
 * Deletes a curriculum material (soft delete)
 */
export async function deleteCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const { id } = req.params;

    await deleteCurriculumMaterial(id, userId, schoolId, req.ip || '0.0.0.0');

    // Log audit action
    await createAuditLog({
      userId,
      schoolId,
      action: 'DELETE_CURRICULUM',
      resourceType: 'curriculum_material',
      resourceId: id,
      ipAddress: req.ip || '0.0.0.0',
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Curriculum deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete curriculum error:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete curriculum',
      errors: [error.message],
    });
  }
}

// ============================================================================
// DOWNLOAD CURRICULUM FILE
// ============================================================================

/**
 * GET /api/v1/curriculum/:id/download
 * Downloads the original curriculum file
 */
export async function downloadCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const { id } = req.params;

    const filePath = await getCurriculumFilePath(id, userId, schoolId, req.ip || '0.0.0.0');

    // Get the curriculum to get the original filename
    const curriculum = await getCurriculumMaterial(id, userId, schoolId);

    // Send file as download
    res.download(filePath, curriculum.originalFileName);
  } catch (error: any) {
    console.error('Download curriculum error:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to download curriculum',
      errors: [error.message],
    });
  }
}

// ============================================================================
// GENERATE ASSIGNMENT FROM CURRICULUM
// ============================================================================

/**
 * POST /api/v1/curriculum/:id/generate-assignment
 * Generates an assignment from curriculum material
 */
export async function generateAssignmentFromCurriculum(req: Request, res: Response): Promise<void> {
  try {
    const { id: userId, schoolId } = (req as any).user;
    const { id } = req.params;
    const {
      title,
      description,
      classId,
      numQuestions,
      difficulty,
      questionTypes,
      type,
      totalPoints,
      dueDate,
      timeLimit,
    } = req.body;

    // Get curriculum material
    const curriculum = await getCurriculumMaterial(id, userId, schoolId);

    if (!curriculum.extractedText) {
      res.status(400).json({
        success: false,
        message: 'Curriculum has not been processed yet',
      });
      return;
    }

    // Verify teacher has access to this class
    const classAccess = await prisma.classTeacher.findFirst({
      where: {
        classId,
        teacherId: userId,
      },
    });

    if (!classAccess) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this class',
      });
      return;
    }

    // Generate quiz from curriculum
    const quizResult = await generateQuizFromCurriculum(curriculum.extractedText, {
      assignmentType: type || 'QUIZ',
      numQuestions: numQuestions || 10,
      questionTypes: questionTypes || ['MULTIPLE_CHOICE'],
      difficulty: difficulty || 'mixed',
    });

    // Create assignment in database
    const assignment = await prisma.assignment.create({
      data: {
        classId,
        schoolId,
        createdBy: userId,
        curriculumSourceId: id, // Link to curriculum
        title: title || quizResult.title,
        description: description || quizResult.description,
        type: type || 'QUIZ',
        status: 'DRAFT',
        totalPoints: totalPoints || quizResult.totalPoints,
        dueDate: dueDate ? new Date(dueDate) : null,
        timeLimit: timeLimit || quizResult.estimatedTimeMinutes,
        aiGenerated: true,
        aiPrompt: `Generated from curriculum: ${curriculum.title}`,
      },
    });

    // Create questions
    const questions = await Promise.all(
      quizResult.questions.map((q, index) => {
        return prisma.question.create({
          data: {
            assignmentId: assignment.id,
            type: q.type,
            questionText: q.questionText,
            questionOrder: index + 1,
            points: q.points,
            concept: q.concept,
            difficulty: q.difficulty,
            // Multiple choice fields
            optionA: q.options?.[0]?.text,
            optionB: q.options?.[1]?.text,
            optionC: q.options?.[2]?.text,
            optionD: q.options?.[3]?.text,
            correctOption: q.correctOption,
            // Free response fields
            correctAnswer: q.correctAnswer,
            rubric: q.rubric,
            explanation: q.explanation,
            aiGenerated: true,
          },
        });
      })
    );

    // Update curriculum usage stats
    await prisma.curriculumMaterial.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Log file action
    await createFileUploadLog({
      userId,
      schoolId,
      curriculumId: id,
      action: 'generate_assignment',
      fileName: curriculum.originalFileName,
      ipAddress: req.ip || '0.0.0.0',
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    // Log audit action
    await createAuditLog({
      userId,
      schoolId,
      action: 'GENERATE_FROM_CURRICULUM',
      resourceType: 'assignment',
      resourceId: assignment.id,
      ipAddress: req.ip || '0.0.0.0',
      userAgent: req.get('user-agent'),
      metadata: {
        curriculumId: id,
        numQuestions: questions.length,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Assignment generated successfully',
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          totalPoints: assignment.totalPoints,
          status: assignment.status,
        },
        questions,
      },
    });
  } catch (error: any) {
    console.error('Generate assignment error:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate assignment',
      errors: [error.message],
    });
  }
}
