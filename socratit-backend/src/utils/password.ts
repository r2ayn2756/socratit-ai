// ============================================================================
// PASSWORD UTILITIES
// Secure password hashing and validation using bcrypt
// ============================================================================

import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if passwords match, false otherwise
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and error messages
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Maximum length (prevent DoS attacks)
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  // Must contain uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Must contain lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Must contain number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Optional: Must contain special character
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push('Password must contain at least one special character');
  // }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if password is in common password list (basic implementation)
 * In production, use a comprehensive list or external service
 * @param password - Password to check
 * @returns True if password is common, false otherwise
 */
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password',
    'password123',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    '1234567',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123',
    '654321',
    'superman',
    'qazwsx',
    'michael',
    'football',
  ];

  return commonPasswords.includes(password.toLowerCase());
};
