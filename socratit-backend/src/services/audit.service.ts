// ============================================================================
// AUDIT SERVICE
// FERPA/COPPA compliance - logs all sensitive data access
// ============================================================================

import { AuditAction } from '@prisma/client';
import { prisma } from '../config/database';
import { AuditLogData } from '../types';

/**
 * Create an audit log entry
 * @param data - Audit log data
 */
export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        schoolId: data.schoolId || null,
        action: data.action as AuditAction,
        resourceType: data.resourceType || null,
        resourceId: data.resourceId || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent || null,
        metadata: data.metadata ? data.metadata : undefined,
      },
    });
  } catch (error) {
    // Log errors but don't fail the request
    console.error('❌ Error creating audit log:', error);
  }
};

/**
 * Generic audit logging function (alias for createAuditLog)
 * @param data - Audit log data
 */
export const logAudit = createAuditLog;

/**
 * Log user login
 */
export const logLogin = async (
  userId: string,
  schoolId: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> => {
  await createAuditLog({
    userId,
    schoolId,
    action: 'LOGIN',
    ipAddress,
    userAgent,
  });
};

/**
 * Log user logout
 */
export const logLogout = async (
  userId: string,
  schoolId: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> => {
  await createAuditLog({
    userId,
    schoolId,
    action: 'LOGOUT',
    ipAddress,
    userAgent,
  });
};

/**
 * Log user registration
 */
export const logRegistration = async (
  userId: string,
  schoolId: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> => {
  await createAuditLog({
    userId,
    schoolId,
    action: 'REGISTER',
    ipAddress,
    userAgent,
  });
};

/**
 * Log password reset
 */
export const logPasswordReset = async (
  userId: string,
  schoolId: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> => {
  await createAuditLog({
    userId,
    schoolId,
    action: 'PASSWORD_RESET',
    ipAddress,
    userAgent,
  });
};

/**
 * Log email verification
 */
export const logEmailVerification = async (
  userId: string,
  schoolId: string,
  ipAddress: string,
  userAgent?: string
): Promise<void> => {
  await createAuditLog({
    userId,
    schoolId,
    action: 'EMAIL_VERIFY',
    ipAddress,
    userAgent,
  });
};

/**
 * Get audit logs for a user
 * @param userId - User ID
 * @param limit - Number of logs to retrieve
 */
export const getUserAuditLogs = async (
  userId: string,
  limit: number = 50
) => {
  return await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

/**
 * Get audit logs for a school
 * @param schoolId - School ID
 * @param limit - Number of logs to retrieve
 */
export const getSchoolAuditLogs = async (
  schoolId: string,
  limit: number = 100
) => {
  return await prisma.auditLog.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
