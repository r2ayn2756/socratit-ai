// ============================================================================
// SOCRATIT.AI DESIGN SYSTEM
// Unified design tokens and configuration for premium glass morphism UI
// Extracted from curriculum.config.ts and extended for app-wide use
// ============================================================================

// ============================================================================
// COLOR SYSTEM (Apple-inspired)
// ============================================================================

export const COLORS = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Neutral grays
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Glass morphism variants
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    medium: 'rgba(255, 255, 255, 0.5)',
    dark: 'rgba(255, 255, 255, 0.3)',
    lighter: 'rgba(255, 255, 255, 0.8)',
    darker: 'rgba(255, 255, 255, 0.4)',
  },

  // Gradient stops for buttons and accents
  gradients: {
    primary: {
      from: '#3b82f6', // blue-500
      to: '#2563eb',   // blue-600
    },
    success: {
      from: '#10b981', // emerald-500
      to: '#059669',   // emerald-600
    },
    error: {
      from: '#ef4444', // red-500
      to: '#dc2626',   // red-600
    },
    warning: {
      from: '#f59e0b', // amber-500
      to: '#d97706',   // amber-600
    },
    purple: {
      from: '#a855f7', // purple-500
      to: '#9333ea',   // purple-600
    },
    pink: {
      from: '#ec4899', // pink-500
      to: '#db2777',   // pink-600
    },
  },
};

// ============================================================================
// SHADOWS & DEPTH (Apple-style elevation)
// ============================================================================

export const SHADOWS = {
  // Standard shadows
  none: '0 0 #0000',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Colored glows for premium buttons
  glow: {
    primary: '0 10px 30px -5px rgba(59, 130, 246, 0.3)',
    primaryHover: '0 15px 35px -5px rgba(59, 130, 246, 0.4)',
    success: '0 10px 30px -5px rgba(16, 185, 129, 0.3)',
    successHover: '0 15px 35px -5px rgba(16, 185, 129, 0.4)',
    error: '0 10px 30px -5px rgba(239, 68, 68, 0.3)',
    errorHover: '0 15px 35px -5px rgba(239, 68, 68, 0.4)',
    purple: '0 10px 30px -5px rgba(168, 85, 247, 0.3)',
    purpleHover: '0 15px 35px -5px rgba(168, 85, 247, 0.4)',
  },
};

// ============================================================================
// BORDER RADIUS (Apple-style rounded corners)
// ============================================================================

export const RADIUS = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  full: '9999px',
};

// ============================================================================
// SPACING SYSTEM (8px base)
// ============================================================================

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
};

// ============================================================================
// ANIMATION & MOTION
// ============================================================================

export const ANIMATION = {
  // Duration in milliseconds
  duration: {
    fastest: 100,
    fast: 150,
    normal: 300,
    slow: 500,
    slowest: 800,
  },

  // Easing functions
  easing: {
    // Standard easing
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Spring-like easing
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Common transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const TYPOGRAPHY = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// ============================================================================
// COMPONENT VARIANTS
// Design tokens for consistent component styling
// ============================================================================

export const COMPONENT_VARIANTS = {
  // Card variants
  card: {
    default: {
      background: 'bg-white',
      border: 'border border-neutral-200',
      shadow: 'shadow-sm',
      radius: 'rounded-xl',
    },
    elevated: {
      background: 'bg-white',
      border: 'border border-neutral-200',
      shadow: 'shadow-lg',
      radius: 'rounded-xl',
    },
    glass: {
      background: 'bg-white/70 backdrop-blur-xl',
      border: 'border border-white/20',
      shadow: 'shadow-sm',
      radius: 'rounded-2xl',
    },
    glassElevated: {
      background: 'bg-white/80 backdrop-blur-2xl',
      border: 'border border-white/30',
      shadow: 'shadow-xl',
      radius: 'rounded-2xl',
    },
  },

  // Button variants
  button: {
    primary: {
      background: 'bg-gradient-to-r from-blue-500 to-blue-600',
      text: 'text-white',
      shadow: 'shadow-lg',
      hover: 'hover:from-blue-600 hover:to-blue-700',
    },
    secondary: {
      background: 'bg-white',
      text: 'text-blue-700',
      border: 'border-2 border-blue-600',
      shadow: 'shadow-sm',
      hover: 'hover:bg-blue-50',
    },
    ghost: {
      background: 'bg-transparent',
      text: 'text-neutral-700',
      border: 'border border-neutral-300',
      hover: 'hover:bg-neutral-50',
    },
    glass: {
      background: 'bg-white/70 backdrop-blur-xl',
      text: 'text-neutral-900',
      border: 'border border-white/20',
      shadow: 'shadow-sm',
      hover: 'hover:bg-white/90',
    },
  },

  // Badge variants
  badge: {
    success: {
      background: 'bg-green-100',
      text: 'text-green-700',
      border: 'border border-green-300',
    },
    warning: {
      background: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border border-yellow-300',
    },
    error: {
      background: 'bg-red-100',
      text: 'text-red-700',
      border: 'border border-red-300',
    },
    info: {
      background: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border border-blue-300',
    },
    glass: {
      background: 'bg-white/50 backdrop-blur-md',
      text: 'text-gray-700',
      border: 'border border-white/20',
    },
  },
};

// ============================================================================
// BREAKPOINTS (Mobile-first responsive design)
// ============================================================================

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// Z-INDEX SCALE (Consistent layering)
// ============================================================================

export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  overlay: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  notification: 1070,
};

// ============================================================================
// UTILITY CLASSES (Common patterns)
// ============================================================================

export const UTILITIES = {
  // Glass morphism presets
  glass: {
    light: 'bg-white/70 backdrop-blur-xl border border-white/20',
    medium: 'bg-white/60 backdrop-blur-lg border border-white/15',
    dark: 'bg-white/40 backdrop-blur-md border border-white/10',
    elevated: 'bg-white/80 backdrop-blur-2xl border border-white/30 shadow-xl',
  },

  // Focus rings
  focus: {
    primary: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    success: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
    error: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
  },

  // Transitions
  transition: {
    all: 'transition-all duration-300 ease-in-out',
    colors: 'transition-colors duration-200',
    transform: 'transition-transform duration-300',
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  COLORS,
  SHADOWS,
  RADIUS,
  SPACING,
  ANIMATION,
  TYPOGRAPHY,
  COMPONENT_VARIANTS,
  BREAKPOINTS,
  Z_INDEX,
  UTILITIES,
};
