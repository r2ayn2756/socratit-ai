/**
 * Typography Configuration
 * Standardized typography system for consistent text styling across the application
 *
 * Usage:
 * import { typography } from '../config/typography.config';
 * <h1 className={typography.h1}>Page Title</h1>
 */

export const typography = {
  // Headings
  h1: 'text-3xl font-bold text-neutral-900 leading-tight',        // Page title (30px)
  h2: 'text-2xl font-bold text-neutral-900 leading-snug',         // Section title (24px)
  h3: 'text-lg font-semibold text-neutral-900 leading-normal',    // Subsection title (18px)
  h4: 'text-base font-semibold text-neutral-900 leading-normal',  // Card title (16px)
  h5: 'text-sm font-semibold text-neutral-900 leading-normal',    // Small heading (14px)

  // Body text
  body: 'text-base text-neutral-700 leading-relaxed',             // Regular text (16px)
  bodyLarge: 'text-lg text-neutral-700 leading-relaxed',          // Large body (18px)
  bodySmall: 'text-sm text-neutral-600 leading-normal',           // Small text (14px)

  // Labels & captions
  label: 'text-sm font-medium text-neutral-700',                  // Form labels (14px)
  labelLarge: 'text-base font-medium text-neutral-700',           // Large labels (16px)
  caption: 'text-xs text-neutral-500 leading-normal',             // Timestamps, metadata (12px)
  overline: 'text-xs font-semibold text-neutral-500 uppercase tracking-wider', // Section overlines

  // Links
  link: 'text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer',
  linkMuted: 'text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer',

  // Stats & Numbers
  statValue: 'text-3xl font-bold text-neutral-900',               // Large stat numbers
  statLabel: 'text-sm font-medium text-neutral-600',              // Stat labels

  // Special text styles
  code: 'font-mono text-sm bg-neutral-100 text-neutral-900 px-1.5 py-0.5 rounded',
  error: 'text-sm text-error font-medium',
  success: 'text-sm text-success font-medium',
  warning: 'text-sm text-warning font-medium',
  muted: 'text-neutral-500',
  disabled: 'text-neutral-400',
} as const;

export type TypographyKey = keyof typeof typography;

// Helper function to combine typography with additional classes
export const withTypography = (key: TypographyKey, additionalClasses?: string): string => {
  return additionalClasses ? `${typography[key]} ${additionalClasses}` : typography[key];
};
