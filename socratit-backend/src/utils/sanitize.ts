// ============================================================================
// SANITIZATION UTILITIES
// Input sanitization and output escaping for security
// ============================================================================

/**
 * Remove sensitive fields from user object
 * @param user - User object
 * @returns Sanitized user object
 */
export const sanitizeUser = (user: any): any => {
  const {
    passwordHash,
    emailVerificationToken,
    emailVerificationExpires,
    passwordResetToken,
    passwordResetExpires,
    deletedAt,
    ...safeUser
  } = user;

  return safeUser;
};

/**
 * Sanitize email address (trim and lowercase)
 * @param email - Email address
 * @returns Sanitized email
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Sanitize string input (trim and remove excessive whitespace)
 * @param input - String input
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Escape HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Remove potentially dangerous characters from file names
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path traversal attempts
  let safe = filename.replace(/\.\./g, '');

  // Remove special characters except dots, hyphens, and underscores
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (safe.length > 255) {
    const ext = safe.split('.').pop();
    const name = safe.substring(0, 255 - (ext?.length || 0) - 1);
    safe = ext ? `${name}.${ext}` : name;
  }

  return safe;
};
