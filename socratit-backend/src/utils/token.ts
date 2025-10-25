// ============================================================================
// TOKEN GENERATION UTILITIES
// Generate secure random tokens for email verification and password reset
// ============================================================================

import crypto from 'crypto';

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex-encoded token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate an email verification token
 * @returns Verification token
 */
export const generateEmailVerificationToken = (): string => {
  return generateSecureToken(32);
};

/**
 * Generate a password reset token
 * @returns Password reset token
 */
export const generatePasswordResetToken = (): string => {
  return generateSecureToken(32);
};

/**
 * Generate a unique class code with hyphen format
 * Format: ABC-1234 (8 characters total: 3 letters, hyphen, 4 numbers)
 * Excludes ambiguous characters: O, I, L (easily confused with 0, 1)
 * @returns Class code in format XXX-YYYY
 */
export const generateClassCode = (): string => {
  // Exclude ambiguous letters: O (looks like 0), I and L (look like 1)
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const numbers = '0123456789';

  let letterPart = '';
  for (let i = 0; i < 3; i++) {
    const randomIndex = crypto.randomInt(0, letters.length);
    letterPart += letters[randomIndex];
  }

  let numberPart = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = crypto.randomInt(0, numbers.length);
    numberPart += numbers[randomIndex];
  }

  return `${letterPart}-${numberPart}`;
};

/**
 * Generate a unique school code
 * Format: 8 alphanumeric characters (uppercase)
 * @returns School code
 */
export const generateSchoolCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }

  return code;
};
