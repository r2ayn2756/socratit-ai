// ============================================================================
// FILE UPLOAD LOG SERVICE
// FERPA/COPPA compliance tracking for all file operations
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FileUploadLogData {
  userId: string;
  schoolId: string;
  curriculumId?: string;
  action: string; // "upload", "process", "delete", "download", "generate_assignment"
  fileName: string;
  fileSize?: number;
  ipAddress: string;
  userAgent?: string;
  processingTime?: number;
  status: string; // "success" or "failed"
  errorMessage?: string;
}

/**
 * Creates a file upload log entry for audit purposes
 */
export async function createFileUploadLog(data: FileUploadLogData) {
  return await prisma.fileUploadLog.create({
    data: {
      userId: data.userId,
      schoolId: data.schoolId,
      curriculumId: data.curriculumId || null,
      action: data.action,
      fileName: data.fileName,
      fileSize: data.fileSize || null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent || null,
      processingTime: data.processingTime || null,
      status: data.status,
      errorMessage: data.errorMessage || null,
    },
  });
}

/**
 * Gets file operation logs for a specific user (for compliance/audit)
 */
export async function getUserFileLog(userId: string, schoolId: string, limit: number = 100) {
  return await prisma.fileUploadLog.findMany({
    where: {
      userId,
      schoolId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Gets file operation logs for a specific curriculum material
 */
export async function getCurriculumFileLog(curriculumId: string, schoolId: string) {
  return await prisma.fileUploadLog.findMany({
    where: {
      curriculumId,
      schoolId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
