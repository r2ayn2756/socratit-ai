// ============================================================================
// AUTHENTICATION MIDDLEWARE
// JWT verification and role-based access control
// ============================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse, UserPayload } from '../types';
import {
  extractTokenFromHeader,
  verifyAccessToken,
} from '../utils/jwt';
import { isTokenBlacklisted } from '../config/redis';
import { UserRole } from '@prisma/client';

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to request
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip authentication for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: 'No authentication token provided',
      };
      res.status(401).json(response);
      return;
    }

    // Check if token is blacklisted (logged out)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      const response: ApiResponse = {
        success: false,
        message: 'Token has been revoked',
      };
      res.status(401).json(response);
      return;
    }

    // Verify token
    const user: UserPayload = verifyAccessToken(token);

    // Attach user and token to request
    req.user = user;
    req.token = token;

    next();
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Invalid authentication token',
    };
    res.status(401).json(response);
  }
};

/**
 * Middleware to require specific role(s)
 * Must be used after requireAuth
 * @param roles - Allowed roles
 */
export const requireRole = (...roles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // Skip role check for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const response: ApiResponse = {
        success: false,
        message: 'Insufficient permissions',
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};

/**
 * Middleware to ensure user can only access their own school data
 * Must be used after requireAuth
 * @param getSchoolId - Function to extract school ID from request
 */
export const requireSameSchool = (
  getSchoolId: (req: AuthenticatedRequest) => string | undefined
) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    const requestedSchoolId = getSchoolId(req);

    if (requestedSchoolId && requestedSchoolId !== req.user.schoolId) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied to resources from other schools',
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const blacklisted = await isTokenBlacklisted(token);
      if (!blacklisted) {
        const user: UserPayload = verifyAccessToken(token);
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};

// ============================================================================
// ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

export const authenticate = requireAuth;
export const authorizeRoles = (roles: UserRole[]) => requireRole(...roles);
