// ============================================================================
// INPUT COMPONENT
// Form input with validation states and React Hook Form integration
// ============================================================================

import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', type, showPasswordToggle, ...props }, ref) => {
    const hasError = !!error;
    const [showPassword, setShowPassword] = useState(false);

    // Determine if we should show the password toggle
    const isPasswordField = type === 'password';
    const shouldShowToggle = isPasswordField && showPasswordToggle;

    // Determine the actual input type
    const inputType = isPasswordField && showPassword ? 'text' : type;

    const baseInputClasses = 'w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const stateClasses = hasError
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-slate-300 focus:border-brand-blue focus:ring-brand-blue/20';

    const iconPaddingClasses = leftIcon ? 'pl-11' : (rightIcon || shouldShowToggle) ? 'pr-11' : '';

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
            type={inputType}
            className={`${baseInputClasses} ${stateClasses} ${iconPaddingClasses}`}
            {...props}
          />

          {shouldShowToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {rightIcon && !shouldShowToggle && (
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
