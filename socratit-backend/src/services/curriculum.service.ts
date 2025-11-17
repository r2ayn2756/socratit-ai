// ============================================================================
// CURRICULUM SERVICE
// Handles curriculum file processing, text extraction, and AI analysis
// ============================================================================

import fs from 'fs/promises';
import mammoth from 'mammoth';
import { PrismaClient } from '@prisma/client';
import { analyzeCurriculumContent } from './ai.service';
import { createFileUploadLog } from './fileLog.service';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export interface CurriculumUploadData {
  userId: string;
  schoolId: string;
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  ipAddress: string;
  userAgent?: string;
}

export interface ProcessingResult {
  success: boolean;
  extractedText?: string;
  error?: string;
  processingTime: number;
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * Creates a curriculum material record in the database
 */
export async function createCurriculumMaterial(data: CurriculumUploadData) {
  const curriculum = await prisma.curriculumMaterial.create({
    data: {
      teacherId: data.userId,
      schoolId: data.schoolId,
      title: data.title,
      description: data.description || null,
      originalFileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      filePath: data.filePath,
      mimeType: data.mimeType,
      processingStatus: 'pending',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    },
  });

  // Log the upload action
  await createFileUploadLog({
    userId: data.userId,
    schoolId: data.schoolId,
    curriculumId: curriculum.id,
    action: 'upload',
    fileName: data.fileName,
    fileSize: data.fileSize,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    status: 'success',
  });

  return curriculum;
}

// ============================================================================
// TEXT EXTRACTION
// ============================================================================

/**
 * Extract text from PDF file
 * TEMPORARY: PDF extraction disabled due to build compatibility issues
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  const stats = await fs.stat(filePath);
  const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown.pdf';
  const fileSize = Math.round(stats.size / 1024);

  return `PDF File Uploaded: ${fileName} (${fileSize}KB)\n\nPDF text extraction is currently unavailable. Please upload a DOCX file instead for automatic text extraction.`;
}

/**
 * Extracts text from DOCX file
 */
async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error: any) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
}

/**
 * Reads text from plain text file
 */
async function extractTextFromTxt(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    throw new Error(`Text file reading failed: ${error.message}`);
  }
}

/**
 * Extracts text from image using OCR (placeholder for future implementation)
 */
async function extractTextFromImage(_filePath: string): Promise<string> {
  // TODO: Implement OCR using Tesseract.js or cloud OCR service
  throw new Error('Image OCR not yet implemented. Please use PDF, DOCX, or TXT files.');
}

/**
 * Extracts text based on file type
 */
export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return await extractTextFromPDF(filePath);
    case 'docx':
    case 'doc':
      return await extractTextFromDocx(filePath);
    case 'txt':
      return await extractTextFromTxt(filePath);
    case 'image':
      return await extractTextFromImage(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// ============================================================================
// CURRICULUM PROCESSING
// ============================================================================

/**
 * Processes a curriculum file: extracts text and analyzes with AI
 */
export async function processCurriculumFile(curriculumId: string, userId: string, schoolId: string): Promise<ProcessingResult> {
  const startTime = Date.now();

  try {
    // Get curriculum material from database
    const curriculum = await prisma.curriculumMaterial.findUnique({
      where: { id: curriculumId },
    });

    if (!curriculum) {
      throw new Error('Curriculum material not found');
    }

    // Verify ownership
    if (curriculum.teacherId !== userId || curriculum.schoolId !== schoolId) {
      throw new Error('Unauthorized: You do not own this curriculum material');
    }

    // Update status to processing
    await prisma.curriculumMaterial.update({
      where: { id: curriculumId },
      data: {
        processingStatus: 'processing',
        processingStartedAt: new Date(),
      },
    });

    // Extract text from file
    const extractedText = await extractTextFromFile(curriculum.filePath, curriculum.fileType);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    // Truncate extremely long texts (max 15,000 characters for AI processing)
    const textForAI = extractedText.substring(0, 15000);

    // Analyze curriculum with AI
    const analysis = await analyzeCurriculumContent(textForAI, {});

    // Update curriculum material with results
    await prisma.curriculumMaterial.update({
      where: { id: curriculumId },
      data: {
        processingStatus: 'completed',
        processingCompletedAt: new Date(),
        extractedText,
        aiSummary: analysis.summary,
        aiOutline: analysis.outline,
        suggestedTopics: analysis.concepts,
        learningObjectives: analysis.objectives,
      },
    });

    // ========================================================================
    // ATLAS INTEGRATION: Auto-generate knowledge graph from curriculum
    // ========================================================================
    try {
      // Import AI Knowledge Graph Service
      const aiKnowledgeGraphService = (await import('./aiKnowledgeGraph.service')).default;

      // Get class information for context
      const classInfo = curriculum.classId
        ? await prisma.class.findUnique({ where: { id: curriculum.classId } })
        : null;

      // Generate concept graph from curriculum text
      const graphResult = await aiKnowledgeGraphService.generateConceptGraphFromCurriculum(
        textForAI,
        classInfo?.subject || 'General',
        classInfo?.gradeLevel || 'Unknown'
      );

      console.log(`✅ Atlas: Generated ${graphResult.conceptsGenerated} concepts and ${graphResult.relationshipsGenerated} relationships from curriculum`);
    } catch (atlasError: any) {
      // Non-blocking: Log error but don't fail the whole processing
      console.error('⚠️ Atlas concept generation failed (non-blocking):', atlasError.message);
    }
    // ========================================================================

    const processingTime = Date.now() - startTime;

    // Log processing success
    await createFileUploadLog({
      userId,
      schoolId,
      curriculumId,
      action: 'process',
      fileName: curriculum.originalFileName,
      ipAddress: '0.0.0.0', // Server-side processing
      status: 'success',
      processingTime,
    });

    return {
      success: true,
      extractedText,
      processingTime,
    };
  } catch (error: any) {
    console.error('Curriculum processing error:', error);

    const processingTime = Date.now() - startTime;

    // Update curriculum material with error
    await prisma.curriculumMaterial.update({
      where: { id: curriculumId },
      data: {
        processingStatus: 'failed',
        processingCompletedAt: new Date(),
        textExtractionError: error.message,
      },
    });

    // Log processing failure
    await createFileUploadLog({
      userId,
      schoolId,
      curriculumId,
      action: 'process',
      fileName: 'unknown',
      ipAddress: '0.0.0.0',
      status: 'failed',
      errorMessage: error.message,
      processingTime,
    });

    return {
      success: false,
      error: error.message,
      processingTime,
    };
  }
}

// ============================================================================
// CURRICULUM MANAGEMENT
// ============================================================================

/**
 * Gets a list of curriculum materials for a teacher
 */
export async function listCurriculumMaterials(
  teacherId: string,
  schoolId: string,
  options: {
    page?: number;
    limit?: number;
    fileType?: string;
    processingStatus?: string;
    isArchived?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
) {
  const {
    page = 1,
    limit = 20,
    fileType,
    processingStatus,
    isArchived,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    teacherId,
    schoolId,
    deletedAt: null,
  };

  if (fileType) {
    where.fileType = fileType;
  }

  if (processingStatus) {
    where.processingStatus = processingStatus;
  }

  if (isArchived !== undefined) {
    where.isArchived = isArchived;
  }

  // Build orderBy clause
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  // Execute query
  const [materials, total] = await Promise.all([
    prisma.curriculumMaterial.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        title: true,
        description: true,
        originalFileName: true,
        fileType: true,
        fileSize: true,
        processingStatus: true,
        aiSummary: true,
        suggestedTopics: true,
        usageCount: true,
        lastUsedAt: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.curriculumMaterial.count({ where }),
  ]);

  return {
    materials,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Gets a single curriculum material by ID
 */
export async function getCurriculumMaterial(curriculumId: string, teacherId: string, schoolId: string) {
  const curriculum = await prisma.curriculumMaterial.findFirst({
    where: {
      id: curriculumId,
      teacherId,
      schoolId,
      deletedAt: null,
    },
    include: {
      assignments: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!curriculum) {
    throw new Error('Curriculum material not found');
  }

  return curriculum;
}

/**
 * Updates curriculum material
 */
export async function updateCurriculumMaterial(
  curriculumId: string,
  teacherId: string,
  schoolId: string,
  data: {
    title?: string;
    description?: string;
    aiSummary?: string;
    aiOutline?: any;
    isArchived?: boolean;
  }
) {
  // Verify ownership
  const curriculum = await prisma.curriculumMaterial.findFirst({
    where: {
      id: curriculumId,
      teacherId,
      schoolId,
      deletedAt: null,
    },
  });

  if (!curriculum) {
    throw new Error('Curriculum material not found');
  }

  // Update the curriculum
  const updated = await prisma.curriculumMaterial.update({
    where: { id: curriculumId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return updated;
}

/**
 * Deletes curriculum material (soft delete)
 */
export async function deleteCurriculumMaterial(curriculumId: string, teacherId: string, schoolId: string, ipAddress: string) {
  // Verify ownership
  const curriculum = await prisma.curriculumMaterial.findFirst({
    where: {
      id: curriculumId,
      teacherId,
      schoolId,
      deletedAt: null,
    },
  });

  if (!curriculum) {
    throw new Error('Curriculum material not found');
  }

  // Soft delete
  await prisma.curriculumMaterial.update({
    where: { id: curriculumId },
    data: {
      deletedAt: new Date(),
    },
  });

  // Log deletion
  await createFileUploadLog({
    userId: teacherId,
    schoolId,
    curriculumId,
    action: 'delete',
    fileName: curriculum.originalFileName,
    fileSize: curriculum.fileSize,
    ipAddress,
    status: 'success',
  });

  // Delete physical file
  try {
    await fs.unlink(curriculum.filePath);
  } catch (error) {
    console.error('Failed to delete physical file:', error);
    // Don't throw - soft delete succeeded
  }

  return { success: true };
}

// ============================================================================
// FILE DOWNLOAD
// ============================================================================

/**
 * Gets the file path for download
 */
export async function getCurriculumFilePath(curriculumId: string, teacherId: string, schoolId: string, ipAddress: string): Promise<string> {
  const curriculum = await prisma.curriculumMaterial.findFirst({
    where: {
      id: curriculumId,
      teacherId,
      schoolId,
      deletedAt: null,
    },
  });

  if (!curriculum) {
    throw new Error('Curriculum material not found');
  }

  // Log download
  await createFileUploadLog({
    userId: teacherId,
    schoolId,
    curriculumId,
    action: 'download',
    fileName: curriculum.originalFileName,
    fileSize: curriculum.fileSize,
    ipAddress,
    status: 'success',
  });

  return curriculum.filePath;
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Deletes expired curriculum materials (called by cron job)
 */
export async function cleanupExpiredCurriculum(): Promise<number> {
  const now = new Date();

  // Find expired materials
  const expiredMaterials = await prisma.curriculumMaterial.findMany({
    where: {
      OR: [
        { expiresAt: { lte: now } },
        {
          deletedAt: {
            lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Deleted > 30 days ago
          },
        },
      ],
    },
  });

  // Delete physical files
  for (const material of expiredMaterials) {
    try {
      await fs.unlink(material.filePath);
      console.log(`Deleted expired file: ${material.filePath}`);
    } catch (error) {
      console.error(`Failed to delete file ${material.filePath}:`, error);
    }
  }

  // Hard delete from database
  const deleteResult = await prisma.curriculumMaterial.deleteMany({
    where: {
      id: {
        in: expiredMaterials.map((m) => m.id),
      },
    },
  });

  console.log(`Cleaned up ${deleteResult.count} expired curriculum materials`);
  return deleteResult.count;
}
