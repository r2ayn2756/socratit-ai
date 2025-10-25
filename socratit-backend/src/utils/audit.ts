// ============================================================================
// AUDIT LOG UTILITY
// Helper functions for creating audit logs
// ============================================================================

import { PrismaClient, AuditAction } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateAuditLogParams {
  userId?: string;
  schoolId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        schoolId: params.schoolId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break application flow
  }
}
