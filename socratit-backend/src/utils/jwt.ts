// ============================================================================
// JWT UTILITIES
// JSON Web Token generation and validation
// ============================================================================

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTAccessPayload, JWTRefreshPayload, UserPayload } from '../types';
import { UserRole } from '@prisma/client';

/**
 * Generate an access token (short-lived)
 * @param payload - User payload
 * @returns Access token
 */
export const generateAccessToken = (payload: {  userId: string;  email: string;  role: UserRole;  schoolId: string;  firstName: string;  lastName: string;}): string => {
  const jwtPayload: JWTAccessPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    schoolId: payload.schoolId,
    firstName: payload.firstName,
    lastName: payload.lastName,
    type: 'access',
  };

  return jwt.sign(jwtPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as jwt.SignOptions);
};

/**
 * Generate a refresh token (long-lived)
 * @param payload - User and session payload
 * @returns Refresh token
 */
export const generateRefreshToken = (payload: {
  userId: string;
  sessionId: string;
}): string => {
  const jwtPayload: JWTRefreshPayload = {
    userId: payload.userId,
    sessionId: payload.sessionId,
    type: 'refresh',
  };

  return jwt.sign(jwtPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as jwt.SignOptions);
};

/**
 * Verify and decode an access token
 * @param token - Access token
 * @returns Decoded payload
 */
export const verifyAccessToken = (token: string): UserPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTAccessPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      schoolId: decoded.schoolId,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify and decode a refresh token
 * @param token - Refresh token
 * @returns Decoded payload
 */
export const verifyRefreshToken = (token: string): JWTRefreshPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTRefreshPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Get expiration time in seconds from a token type
 * @param tokenType - Type of token ('access' or 'refresh')
 * @returns Expiration time in seconds
 */
export const getTokenExpirySeconds = (tokenType: 'access' | 'refresh'): number => {
  const expiry = tokenType === 'access' ? env.JWT_ACCESS_EXPIRY : env.JWT_REFRESH_EXPIRY;

  // Parse expiry string (e.g., '15m', '7d')
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid token expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * multipliers[unit];
};

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token or null
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
};
