/**
 * Utility function for merging Tailwind CSS classes
 *
 * This function combines multiple class names and removes duplicates,
 * giving precedence to later classes in case of conflicts.
 *
 * Usage:
 * import { cn } from '../utils/cn';
 *
 * <div className={cn('p-4 bg-white', isActive && 'bg-blue-100', className)}>
 *
 * Benefits:
 * - Handles conditional classes elegantly
 * - Removes duplicate/conflicting Tailwind classes
 * - Type-safe with TypeScript
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (!input) return;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const result = cn(...input);
      if (result) {
        classes.push(result);
      }
    }
  });

  // Remove duplicates while preserving order
  return classes
    .join(' ')
    .split(' ')
    .filter((value, index, self) => {
      // Keep only the last occurrence of each class
      const lastIndex = self.lastIndexOf(value);
      return index === lastIndex;
    })
    .filter(Boolean)
    .join(' ');
}

// Alternative: If you want to use clsx + tailwind-merge for better conflict resolution
// Install: npm install clsx tailwind-merge
//
// import { clsx, type ClassValue } from 'clsx';
// import { twMerge } from 'tailwind-merge';
//
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }
