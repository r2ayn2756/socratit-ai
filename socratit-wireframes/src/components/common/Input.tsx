// ============================================================================
// INPUT COMPONENT
// Form input with validation states and React Hook Form integration
// ============================================================================

import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const hasError = !!error;

    const baseInputClasses = 'w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const stateClasses = hasError
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-slate-300 focus:border-brand-blue focus:ring-brand-blue/20';

    const iconPaddingClasses = leftIcon ? 'pl-11' : rightIcon ? 'pr-11' : '';

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`${baseInputClasses} ${stateClasses} ${iconPaddingClasses}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
