// ============================================================================
// TYPE DEFINITIONS
// Centralized type definitions for the backend application
// ============================================================================

import { Request } from 'express';
import { UserRole } from '@prisma/client';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string;
  firstName: string;
  lastName: string;
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId: string;
  gradeLevel?: string | null;
  profilePhotoUrl?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface RegisterRequestBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolCode: string;
  gradeLevel?: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequestBody {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutRequestBody {
  refreshToken: string;
}

export interface ForgotPasswordRequestBody {
  email: string;
}

export interface ResetPasswordRequestBody {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequestBody {
  token: string;
}

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequestBody {
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
}

// ============================================================================
// REQUEST TYPES (Express with auth)
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
  token?: string;
  class?: any; // Attached by class middleware
  enrollment?: any; // Attached by enrollment middleware
}

// Alias for backward compatibility
export type AuthRequest = AuthenticatedRequest;

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLogData {
  userId?: string;
  schoolId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  firstName: string;
  verificationLink: string;
}

export interface PasswordResetEmailData {
  firstName: string;
  resetLink: string;
}

// ============================================================================
// TOKEN TYPES
// ============================================================================

export interface JWTAccessPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId: string;
  firstName: string;
  lastName: string;
  type: 'access';
}

export interface JWTRefreshPayload {
  userId: string;
  sessionId: string;
  type: 'refresh';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

// ============================================================================
// CLASS MANAGEMENT TYPES
// ============================================================================

export interface CreateClassRequestBody {
  name: string;
  subject?: string;
  gradeLevel?: string;
  academicYear: string;
  period?: string;
  room?: string;
  scheduleTime?: string;
  color?: 'blue' | 'purple' | 'orange';
  codeExpiresAt?: Date;
}

export interface UpdateClassRequestBody {
  name?: string;
  subject?: string;
  gradeLevel?: string;
  academicYear?: string;
  period?: string;
  room?: string;
  scheduleTime?: string;
  color?: 'blue' | 'purple' | 'orange';
  isActive?: boolean;
  codeExpiresAt?: Date | null;
}

export interface EnrollWithCodeRequestBody {
  classCode: string;
}

export interface AddStudentsRequestBody {
  studentEmails: string[];
}

export interface ProcessEnrollmentRequestBody {
  status: 'APPROVED' | 'REJECTED' | 'REMOVED';
  rejectionReason?: string;
}

export interface ClassWithStats {
  id: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  academicYear: string;
  period?: string;
  room?: string;
  scheduleTime?: string;
  color: string;
  classCode: string;
  codeExpiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  teachers: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isPrimary: boolean;
  }[];
  enrollmentCounts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    removed: number;
  };
}

export interface EnrollmentWithDetails {
  id: string;
  status: string;
  requestedAt: Date;
  processedAt?: Date | null;
  rejectionReason?: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gradeLevel?: string | null;
  };
  class: {
    id: string;
    name: string;
    subject?: string | null;
    period?: string | null;
    room?: string | null;
    teachers: {
      id: string;
      firstName: string;
      lastName: string;
    }[];
  };
  processor?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}
