// ============================================================================
// AUTH CONTROLLER
// Handles all authentication-related requests
// ============================================================================

import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { hashPassword, comparePassword, validatePasswordStrength, isCommonPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpirySeconds } from '../utils/jwt';
import { generateEmailVerificationToken, generatePasswordResetToken } from '../utils/token';
import { sanitizeUser, sanitizeEmail } from '../utils/sanitize';
import { sendPasswordResetEmail } from '../services/email.service';
import { createAuditLog, logLogin, logLogout, logRegistration, logPasswordReset, logEmailVerification } from '../services/audit.service';
import { blacklistToken } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import {
  AuthenticatedRequest,
  ApiResponse,
  RegisterRequestBody,
  LoginRequestBody,
  LoginResponse,
  RefreshTokenRequestBody,
  RefreshTokenResponse,
  LogoutRequestBody,
  ForgotPasswordRequestBody,
  ResetPasswordRequestBody,
  VerifyEmailRequestBody,
  ChangePasswordRequestBody,
  UpdateProfileRequestBody,
  SafeUser,
} from '../types';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: RegisterRequestBody = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent');

  try {
    // Sanitize email
    const email = sanitizeEmail(body.email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(body.password);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join(', '), 400);
    }

    // Check for common passwords
    if (isCommonPassword(body.password)) {
      throw new AppError('Password is too common, please choose a stronger password', 400);
    }

    // Validate or assign school
    let school;

    if (body.schoolCode) {
      // If school code provided, validate it
      school = await prisma.school.findUnique({
        where: { schoolCode: body.schoolCode },
      });

      if (!school) {
        throw new AppError('Invalid school code', 400);
      }
    } else {
      // If no school code provided (e.g., for teachers signing up without organization),
      // create a new personal/individual school for this teacher to ensure data isolation
      const schoolCode = `TEACH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      school = await prisma.school.create({
        data: {
          name: `${body.firstName} ${body.lastName}'s School`,
          schoolCode: schoolCode,
        },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken();
    const verificationExpires = new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRY);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        schoolId: school.id,
        gradeLevel: body.gradeLevel || null,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email (disabled for development)
    // TODO: Re-enable email verification in production
    // const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    // await sendVerificationEmail(user.email, {
    //   firstName: user.firstName,
    //   verificationLink,
    // });

    // Log registration
    await logRegistration(user.id, user.schoolId, ipAddress, userAgent);

    const response: ApiResponse<{ user: SafeUser }> = {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: sanitizeUser(user) as SafeUser,
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Registration failed', error.statusCode || 500);
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: LoginRequestBody = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent');

  try {
    // Sanitize email
    const email = sanitizeEmail(body.email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(body.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if email is verified (disabled for development)
    // TODO: Re-enable email verification in production
    // if (!user.emailVerified) {
    //   throw new AppError('Please verify your email before logging in', 403);
    // }

    // Generate tokens
    const sessionId = uuidv4();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId,
    });

    // Store session in database
    const expiresAt = new Date(Date.now() + getTokenExpirySeconds('refresh') * 1000);
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken,
        accessTokenFamily: uuidv4(), // For token rotation
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log login
    await logLogin(user.id, user.schoolId, ipAddress, userAgent);

    const response: ApiResponse<LoginResponse> = {
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user) as SafeUser,
        accessToken,
        refreshToken,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Login failed', error.statusCode || 500);
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: RefreshTokenRequestBody = req.body;

  try {
    // Verify refresh token (will throw if invalid)
    verifyRefreshToken(body.refreshToken);

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { refreshToken: body.refreshToken },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Check if user is deleted
    if (session.user.deletedAt) {
      throw new AppError('User account no longer exists', 401);
    }

    // Generate new tokens
    const newSessionId = uuidv4();
    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      schoolId: session.user.schoolId,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
    });
    const newRefreshToken = generateRefreshToken({
      userId: session.user.id,
      sessionId: newSessionId,
    });

    // Revoke old session
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Create new session
    const expiresAt = new Date(Date.now() + getTokenExpirySeconds('refresh') * 1000);
    await prisma.session.create({
      data: {
        id: newSessionId,
        userId: session.user.id,
        refreshToken: newRefreshToken,
        accessTokenFamily: session.accessTokenFamily, // Maintain family for rotation detection
        expiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
      },
    });

    const response: ApiResponse<RefreshTokenResponse> = {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Token refresh failed', error.statusCode || 500);
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: LogoutRequestBody = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent');

  try {
    if (!req.user || !req.token) {
      throw new AppError('Authentication required', 401);
    }

    // Revoke refresh token session
    await prisma.session.updateMany({
      where: {
        refreshToken: body.refreshToken,
        userId: req.user.id,
      },
      data: { revokedAt: new Date() },
    });

    // Blacklist access token
    const tokenExpiry = getTokenExpirySeconds('access');
    await blacklistToken(req.token, tokenExpiry);

    // Log logout
    await logLogout(req.user.id, req.user.schoolId, ipAddress, userAgent);

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Logout failed', error.statusCode || 500);
  }
};

/**
 * Verify email
 * POST /api/v1/auth/verify-email
 */
export const verifyEmail = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: VerifyEmailRequestBody = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent');

  try {
    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: body.token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Log email verification
    await logEmailVerification(user.id, user.schoolId, ipAddress, userAgent);

    const response: ApiResponse = {
      success: true,
      message: 'Email verified successfully',
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Email verification failed', error.statusCode || 500);
  }
};

/**
 * Forgot password - send reset email
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: ForgotPasswordRequestBody = req.body;

  try {
    // Sanitize email
    const email = sanitizeEmail(body.email);

    // Find user (don't reveal if user exists for security)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && !user.deletedAt) {
      // Generate reset token
      const resetToken = generatePasswordResetToken();
      const resetExpires = new Date(Date.now() + env.PASSWORD_RESET_EXPIRY);

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      // Send reset email
      const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, {
        firstName: user.firstName,
        resetLink,
      });
    }

    // Always return success to prevent email enumeration
    const response: ApiResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Password reset request failed', error.statusCode || 500);
  }
};

/**
 * Reset password
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: ResetPasswordRequestBody = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent');

  try {
    // Find user with reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: body.token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(body.newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join(', '), 400);
    }

    // Check for common passwords
    if (isCommonPassword(body.newPassword)) {
      throw new AppError('Password is too common, please choose a stronger password', 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(body.newPassword);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all sessions for security
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    });

    // Log password reset
    await logPasswordReset(user.id, user.schoolId, ipAddress, userAgent);

    const response: ApiResponse = {
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Password reset failed', error.statusCode || 500);
  }
};

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || user.deletedAt) {
      throw new AppError('User not found', 404);
    }

    const response: ApiResponse<{ user: SafeUser }> = {
      success: true,
      data: {
        user: sanitizeUser(user) as SafeUser,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to fetch profile', error.statusCode || 500);
  }
};

/**
 * Update user profile
 * PATCH /api/v1/users/me
 */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: UpdateProfileRequestBody = req.body;

  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        profilePhotoUrl: body.profilePhotoUrl,
      },
    });

    const response: ApiResponse<{ user: SafeUser }> = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: sanitizeUser(user) as SafeUser,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to update profile', error.statusCode || 500);
  }
};

/**
 * Change password
 * POST /api/v1/users/change-password
 */
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const body: ChangePasswordRequestBody = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent');

  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || user.deletedAt) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(body.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(body.newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(passwordValidation.errors.join(', '), 400);
    }

    // Check for common passwords
    if (isCommonPassword(body.newPassword)) {
      throw new AppError('Password is too common, please choose a stronger password', 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(body.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Revoke all other sessions (keep current one)
    await prisma.session.updateMany({
      where: {
        userId: user.id,
        // Keep current session if refresh token was provided
        // This would require passing refreshToken in the request
      },
      data: { revokedAt: new Date() },
    });

    // Log password change
    await createAuditLog({
      userId: user.id,
      schoolId: user.schoolId,
      action: 'UPDATE_USER',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      metadata: { action: 'password_change' },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to change password', error.statusCode || 500);
  }
};

// ============================================================================
// OAUTH AUTHENTICATION
// ============================================================================

/**
 * Google OAuth callback handler
 * GET /api/v1/auth/google/callback
 */
export const googleCallback = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // User is attached by passport middleware
    if (!req.user) {
      throw new AppError('OAuth authentication failed', 401);
    }

    const user = req.user as any;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent');

    // Generate tokens
    const sessionId = uuidv4();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId,
    });

    // Store session in database
    const expiresAt = new Date(Date.now() + getTokenExpirySeconds('refresh') * 1000);
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken,
        accessTokenFamily: uuidv4(),
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log login
    await logLogin(user.id, user.schoolId, ipAddress, userAgent);

    // Redirect to frontend with tokens and user data
    const userData = encodeURIComponent(JSON.stringify(sanitizeUser(user)));
    const redirectUrl = `${env.FRONTEND_URL}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}&user=${userData}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    const errorMsg = encodeURIComponent(error.message || 'Authentication failed');
    res.redirect(`${env.FRONTEND_URL}/auth/callback?error=${errorMsg}`);
  }
};

/**
 * Microsoft OAuth callback handler
 * GET /api/v1/auth/microsoft/callback
 */
export const microsoftCallback = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // User is attached by passport middleware
    if (!req.user) {
      throw new AppError('OAuth authentication failed', 401);
    }

    const user = req.user as any;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent');

    // Generate tokens
    const sessionId = uuidv4();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId,
    });

    // Store session in database
    const expiresAt = new Date(Date.now() + getTokenExpirySeconds('refresh') * 1000);
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken,
        accessTokenFamily: uuidv4(),
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log login
    await logLogin(user.id, user.schoolId, ipAddress, userAgent);

    // Redirect to frontend with tokens and user data
    const userData = encodeURIComponent(JSON.stringify(sanitizeUser(user)));
    const redirectUrl = `${env.FRONTEND_URL}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}&user=${userData}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Microsoft OAuth callback error:', error);
    const errorMsg = encodeURIComponent(error.message || 'Authentication failed');
    res.redirect(`${env.FRONTEND_URL}/auth/callback?error=${errorMsg}`);
  }
};
