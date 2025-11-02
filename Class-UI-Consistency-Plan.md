# CLASS UI CONSISTENCY PLAN
## Socratit.ai - Standardizing All Class-Related Pages & Components

**Created:** November 1, 2025
**Status:** Ready for Implementation
**Priority:** HIGH - Production Blocker

---

## EXECUTIVE SUMMARY

After comprehensive analysis of all class-related UI components, I've identified **8 major inconsistency categories** affecting 30+ files. This plan provides a step-by-step roadmap to create a cohesive, professional class management experience.

**Key Issues:**
- 2 incompatible Button components causing confusion
- 4+ different card styling approaches
- 4+ different empty state implementations
- No standardized section headers, stat cards, or loading states
- Scattered color/spacing tokens without design system

**Timeline:** 2 weeks (10 working days)
**Effort:** ~60-80 developer hours

---

## TABLE OF CONTENTS

1. [Design System Foundations](#1-design-system-foundations)
2. [Component Standardization](#2-component-standardization)
3. [Section-by-Section Updates](#3-section-by-section-updates)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Testing Checklist](#5-testing-checklist)
6. [Success Metrics](#6-success-metrics)

---

## 1. DESIGN SYSTEM FOUNDATIONS

### 1.1 Color System (Priority: P0 - Critical)

**Current Problem:**
- Mixed color naming: `blue-500`, `brand-blue`, `primary`, `indigo-500`
- Inconsistent gradients: `from-blue-500 to-blue-600` vs `from-blue-400 to-blue-600`
- No semantic color usage

**Solution: Create Color Tokens**

**File:** `socratit-wireframes/tailwind.config.js`

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary Colors (Class Management)
        primary: {
          50: '#EFF6FF',   // Light background
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',  // Primary button
          600: '#2563EB',  // Hover state
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // Secondary Colors (Accents)
        secondary: {
          50: '#F5F3FF',
          500: '#8B5CF6',  // Purple accents
          600: '#7C3AED',
        },

        // Success, Warning, Error (unchanged)
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',

        // Neutral (Unified gray/slate)
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
    },
  },
};
```

**Migration Plan:**
- Replace `blue-*` with `primary-*` across all class components
- Replace `gray-*` and `slate-*` with `neutral-*`
- Replace `purple-*` with `secondary-*`
- Use semantic names in new code

**Affected Files:**
- All 12 class components
- ClassDashboard.tsx
- ClassRoster.tsx
- TeacherClasses.tsx

---

### 1.2 Spacing System (Priority: P0 - Critical)

**Current Problem:**
- 12+ different padding values used inconsistently
- No grid system (uses `p-2`, `p-3`, `p-4`, `p-5`, `p-6`, `p-12`)
- Inconsistent gap values

**Solution: 8-Point Grid System**

```js
// tailwind.config.js
module.exports = {
  theme: {
    spacing: {
      0: '0px',
      1: '4px',    // 0.25rem - micro spacing
      2: '8px',    // 0.5rem  - tight spacing
      3: '12px',   // 0.75rem - standard gap
      4: '16px',   // 1rem    - default padding
      5: '20px',   // 1.25rem - medium padding
      6: '24px',   // 1.5rem  - section padding
      8: '32px',   // 2rem    - large padding
      10: '40px',  // 2.5rem  - extra large
      12: '48px',  // 3rem    - hero padding
    },
  },
};
```

**Usage Guidelines:**

| Spacing | Value | Use Case |
|---------|-------|----------|
| `p-4` | 16px | Default card padding |
| `p-6` | 24px | Section/modal padding |
| `gap-3` | 12px | Default flex/grid gap |
| `gap-4` | 16px | Large gap (stat cards) |
| `mb-4` | 16px | Standard bottom margin |
| `mb-6` | 24px | Section bottom margin |

**Standardization:**
- All cards: `p-6` (24px)
- All stat card grids: `gap-4` (16px)
- All section headers: `gap-3` (12px) for icon/text
- All buttons: `px-6 py-3` (24px x 12px)

---

### 1.3 Typography System (Priority: P1 - High)

**Current Problem:**
- Section headers use `text-2xl` in some places, `text-lg` in others
- No consistent heading hierarchy

**Solution: Typography Scale**

```tsx
// src/config/typography.config.ts
export const typography = {
  // Headings
  h1: 'text-3xl font-bold text-neutral-900',        // Page title
  h2: 'text-2xl font-bold text-neutral-900',        // Section title
  h3: 'text-lg font-semibold text-neutral-900',     // Subsection title
  h4: 'text-base font-semibold text-neutral-900',   // Card title

  // Body text
  body: 'text-base text-neutral-700',               // Regular text
  bodyLarge: 'text-lg text-neutral-700',            // Large body
  bodySmall: 'text-sm text-neutral-600',            // Small text

  // Labels & captions
  label: 'text-sm font-medium text-neutral-700',    // Form labels
  caption: 'text-xs text-neutral-500',              // Timestamps, metadata

  // Links
  link: 'text-primary-600 hover:text-primary-700 font-medium',
};
```

**Usage in Components:**

```tsx
// Before (inconsistent)
<h2 className="text-2xl font-bold text-gray-900">Section Title</h2>
<h2 className="text-lg font-semibold text-gray-900">Section Title</h2>

// After (consistent)
import { typography } from '../../config/typography.config';
<h2 className={typography.h2}>Section Title</h2>
```

---

### 1.4 Border & Radius System (Priority: P1 - High)

**Current Problem:**
- Mix of `rounded-lg`, `rounded-xl`, `rounded-2xl`
- No clear usage guidelines

**Solution: Standardized Radius Scale**

| Radius | Value | Use Case |
|--------|-------|----------|
| `rounded-lg` | 8px | Buttons, inputs, small cards |
| `rounded-xl` | 12px | Standard cards, modals |
| `rounded-2xl` | 16px | Hero sections, major containers |
| `rounded-full` | 50% | Avatar containers, icon badges |

**Border Guidelines:**

| Border | Value | Use Case |
|--------|-------|----------|
| `border` | 1px | Default card borders |
| `border-2` | 2px | Emphasized borders (active state) |

**Standardization:**
- All cards: `rounded-xl border border-neutral-200`
- All icon containers: `rounded-lg` (8px)
- All buttons: `rounded-lg` (8px)
- All modals: `rounded-2xl` (16px)

---

## 2. COMPONENT STANDARDIZATION

### 2.1 Button Component (Priority: P0 - CRITICAL)

**Current Problem:**
- Two incompatible Button components:
  - `components/common/Button.tsx` - Uses `isLoading`, `leftIcon/rightIcon`
  - `components/curriculum/Button.tsx` - Uses `loading`, `icon + iconPosition`

**Solution: Merge into Single Button Component**

**File:** `socratit-wireframes/src/components/common/Button.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn'; // Utility for merging classes

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = cn(
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      fullWidth && 'w-full'
    );

    // Variant classes
    const variantClasses = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700 active:bg-primary-800',
        'focus-visible:ring-primary-500',
        'shadow-sm hover:shadow-md',
      ),
      secondary: cn(
        'bg-white text-primary-700 border-2 border-primary-600',
        'hover:bg-primary-50 active:bg-primary-100',
        'focus-visible:ring-primary-500',
      ),
      ghost: cn(
        'bg-transparent text-neutral-700 border border-neutral-300',
        'hover:bg-neutral-50 active:bg-neutral-100',
        'focus-visible:ring-neutral-400',
      ),
      danger: cn(
        'bg-error text-white',
        'hover:bg-red-700 active:bg-red-800',
        'focus-visible:ring-red-500',
        'shadow-sm hover:shadow-md',
      ),
      success: cn(
        'bg-success text-white',
        'hover:bg-green-700 active:bg-green-800',
        'focus-visible:ring-green-500',
        'shadow-sm hover:shadow-md',
      ),
    };

    // Size classes
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm gap-2 rounded-lg',
      md: 'px-6 py-3 text-base gap-3 rounded-lg',
      lg: 'px-8 py-4 text-lg gap-3 rounded-lg',
    };

    // Icon sizes
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const iconContent = loading ? (
      <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
    ) : icon ? (
      <span className={iconSizes[size]}>{icon}</span>
    ) : null;

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        disabled={disabled || loading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {iconPosition === 'left' && iconContent}
        {children}
        {iconPosition === 'right' && iconContent}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
```

**Migration Steps:**

1. **Update imports** in all class components:
```tsx
// Before
import { Button } from '../../components/curriculum/Button';

// After
import { Button } from '../../components/common/Button';
```

2. **Update prop names**:
```tsx
// Before
<Button isLoading={true} leftIcon={<Icon />}>...</Button>

// After
<Button loading={true} icon={<Icon />} iconPosition="left">...</Button>
```

3. **Delete** `src/components/curriculum/Button.tsx`

**Affected Files:**
- `ClassHeader.tsx` (line 9, 59)
- `CurriculumSection.tsx` (line 9, 185)
- `RosterSection.tsx` (line 9, 113)
- `AssignmentsSection.tsx` (line 9, 73)
- `ProgressSection.tsx` (line 9, 181)
- `CollapsibleSection.tsx` (line 9, 58)
- `ClassAnalyticsSection.tsx` (line 23, 262-282) - Already uses common Button

---

### 2.2 Card Component (Priority: P0 - CRITICAL)

**Current Problem:**
- Multiple card styling approaches:
  - Inline classes: `bg-white/80 backdrop-blur-xl border...`
  - Card component with variants
  - Mixed shadow/border usage

**Solution: Standardized Card Component**

**File:** `socratit-wireframes/src/components/common/Card.tsx`

```tsx
import React from 'react';
import { cn } from '../../utils/cn';

export type CardVariant = 'default' | 'elevated' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hover = false, children, className, ...props }, ref) => {
    // Variant classes
    const variantClasses = {
      default: 'bg-white border border-neutral-200 shadow-sm',
      elevated: 'bg-white border border-neutral-200 shadow-lg',
      ghost: 'bg-white/80 backdrop-blur-xl border border-neutral-200/50',
    };

    // Padding classes
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    // Hover effect
    const hoverClass = hover ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-1' : '';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          variantClasses[variant],
          paddingClasses[padding],
          hoverClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
```

**Usage Examples:**

```tsx
// Default card (most common)
<Card>Content</Card>

// No padding (for custom layouts)
<Card padding="none">
  <div className="p-6 border-b">Header</div>
  <div className="p-6">Content</div>
</Card>

// Elevated card (important sections)
<Card variant="elevated">Important content</Card>

// Ghost card (overlays, headers)
<Card variant="ghost">Floating content</Card>

// Hoverable card (clickable items)
<Card hover onClick={handleClick}>Clickable</Card>
```

**Migration Steps:**

1. **Replace inline card classes**:
```tsx
// Before
<div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6">

// After
<Card variant="ghost" padding="md">
```

2. **Standardize all cards**:
```tsx
// ClassHeader.tsx (line 33)
// Before
<div className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-2xl p-6 shadow-lg">

// After
<Card variant="ghost" padding="md" className="shadow-lg">
```

**Affected Files:**
- `ClassHeader.tsx` (line 33)
- `CollapsibleSection.tsx` (line 38)
- `LessonsSection.tsx` (line 125)
- All other components with inline card styling

---

### 2.3 Empty State Component (Priority: P0 - CRITICAL)

**Current Problem:**
- 4+ different empty state implementations
- Inconsistent styling, icons, messaging

**Solution: Reusable EmptyState Component**

**File:** `socratit-wireframes/src/components/common/EmptyState.tsx`

```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'subtle';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  variant = 'default',
  className,
}) => {
  const isSubtle = variant === 'subtle';

  return (
    <div className={cn('text-center py-8', className)}>
      {/* Icon */}
      <div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
          isSubtle ? 'bg-neutral-50' : 'bg-primary-50'
        )}
      >
        <Icon className={cn('w-8 h-8', isSubtle ? 'text-neutral-400' : 'text-primary-500')} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>

      {/* Message */}
      <p className="text-sm text-neutral-600 mb-6 max-w-sm mx-auto">{message}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <Button
              variant="primary"
              onClick={action.onClick}
              icon={action.icon ? <action.icon /> : undefined}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
```

**Usage Examples:**

```tsx
// RosterSection - No students
<EmptyState
  icon={Users}
  title="No Students Enrolled Yet"
  message="Get started by adding students to your class. They'll receive an invitation to join."
  action={{
    label: 'Add First Student',
    onClick: onAddStudent,
    icon: UserPlus,
  }}
/>

// AssignmentsSection - No assignments
<EmptyState
  icon={FileText}
  title="No Assignments Created Yet"
  message="Create your first assignment to engage students with interactive learning."
  action={{
    label: 'Create First Assignment',
    onClick: onCreateAssignment,
    icon: Plus,
  }}
/>

// LessonsSection - No lessons (subtle variant)
<EmptyState
  variant="subtle"
  icon={BookOpen}
  title="No Lessons Recorded Yet"
  message="Start recording lessons to build your class knowledge base."
  action={{
    label: 'Record First Lesson',
    onClick: onStartRecording,
  }}
/>
```

**Migration Steps:**

1. **Replace all empty state implementations**:

```tsx
// RosterSection.tsx (lines 120-136)
// Before
<div className="text-center py-8">
  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
    <Users className="w-8 h-8 text-gray-400" />
  </div>
  <p className="text-gray-600 mb-4">No students enrolled yet</p>
  <Button variant="primary" onClick={onAddStudent} icon={<UserPlus />}>
    Add First Student
  </Button>
</div>

// After
<EmptyState
  icon={Users}
  title="No Students Enrolled Yet"
  message="Get started by adding students to your class."
  action={{
    label: 'Add First Student',
    onClick: onAddStudent,
    icon: UserPlus,
  }}
/>
```

**Affected Files:**
- `RosterSection.tsx` (lines 120-136)
- `AssignmentsSection.tsx` (lines 67-83)
- `LessonsSection.tsx` (lines 125-136)
- `ClassAnalyticsSection.tsx` (lines 207-216, 518-528, 532-540)

---

### 2.4 Loading State Component (Priority: P1 - High)

**Current Problem:**
- Multiple spinner implementations with different sizes/colors
- No consistent loading message

**Solution: Reusable LoadingSpinner Component**

**File:** `socratit-wireframes/src/components/common/LoadingSpinner.tsx`

```tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn(sizeClasses[size], 'text-primary-600 animate-spin')} />
      {message && <p className="mt-4 text-sm text-neutral-600">{message}</p>}
    </div>
  );
};
```

**Usage Examples:**

```tsx
// ClassDashboard loading state
if (isLoading) {
  return (
    <DashboardLayout userRole="teacher">
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading class data..." />
      </div>
    </DashboardLayout>
  );
}

// Inline loading (e.g., in sections)
{isLoadingLessons ? (
  <LoadingSpinner size="md" message="Loading lessons..." />
) : (
  <LessonsList lessons={lessons} />
)}
```

**Migration Steps:**

```tsx
// ClassDashboard.tsx (lines 215-226)
// Before
<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
<p className="text-gray-600">Loading class...</p>

// After
<LoadingSpinner size="lg" message="Loading class..." />
```

**Affected Files:**
- `ClassDashboard.tsx` (line 220)
- `ClassAnalyticsSection.tsx` (line 289)
- `LessonsSection.tsx` (line 119)
- `ClassRoster.tsx` (line 255)

---

### 2.5 Section Header Component (Priority: P1 - High)

**Current Problem:**
- Inconsistent section header implementations
- Different icon sizes, title sizes, spacing

**Solution: Reusable SectionHeader Component**

**File:** `socratit-wireframes/src/components/common/SectionHeader.tsx`

```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  count?: number;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  count,
  action,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Left side: Icon + Title */}
      <div className="flex items-center gap-3">
        {/* Icon container */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Title & Subtitle */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-lg font-normal text-neutral-500">({count})</span>
            )}
          </h2>
          {subtitle && <p className="text-sm text-neutral-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Right side: Action button */}
      {action && (
        <Button
          variant={action.variant || 'ghost'}
          onClick={action.onClick}
          icon={action.icon ? <action.icon /> : undefined}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
```

**Usage Examples:**

```tsx
// Simple header
<SectionHeader
  icon={Users}
  title="Class Roster"
  count={24}
/>

// With subtitle and action
<SectionHeader
  icon={FileText}
  title="Assignments"
  subtitle="Recent assignments and submissions"
  count={8}
  action={{
    label: 'Create Assignment',
    onClick: onCreateAssignment,
    icon: Plus,
    variant: 'primary',
  }}
/>

// With secondary action
<SectionHeader
  icon={BookOpen}
  title="Lesson Notes"
  count={5}
  action={{
    label: 'View All',
    onClick: onViewAll,
    variant: 'ghost',
  }}
/>
```

**Note:** This can replace the header portion of `CollapsibleSection` for consistency.

---

### 2.6 Stat Card Component (Priority: P1 - High)

**Current Problem:**
- 4+ different stat card implementations
- Inconsistent grid layouts, padding, styling

**Solution: Reusable StatCard Component**

**File:** `socratit-wireframes/src/components/common/StatCard.tsx`

```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type StatCardColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: StatCardColor;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  color = 'primary',
  trend,
  onClick,
  className,
}) => {
  const colorClasses = {
    primary: {
      bg: 'from-primary-50 to-primary-100',
      border: 'border-primary-200',
      icon: 'bg-primary-500',
      text: 'text-primary-900',
      label: 'text-primary-700',
    },
    secondary: {
      bg: 'from-secondary-50 to-secondary-100',
      border: 'border-secondary-200',
      icon: 'bg-secondary-500',
      text: 'text-secondary-900',
      label: 'text-secondary-700',
    },
    success: {
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      icon: 'bg-success',
      text: 'text-green-900',
      label: 'text-green-700',
    },
    warning: {
      bg: 'from-yellow-50 to-yellow-100',
      border: 'border-yellow-200',
      icon: 'bg-warning',
      text: 'text-yellow-900',
      label: 'text-yellow-700',
    },
    error: {
      bg: 'from-red-50 to-red-100',
      border: 'border-red-200',
      icon: 'bg-error',
      text: 'text-red-900',
      label: 'text-red-700',
    },
    neutral: {
      bg: 'from-neutral-50 to-neutral-100',
      border: 'border-neutral-200',
      icon: 'bg-neutral-500',
      text: 'text-neutral-900',
      label: 'text-neutral-700',
    },
  };

  const colors = colorClasses[color];

  const CardContent = (
    <div
      className={cn(
        'p-6 rounded-xl border-2',
        `bg-gradient-to-br ${colors.bg} ${colors.border}`,
        onClick && 'cursor-pointer transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className={cn('text-sm font-medium', colors.label)}>{label}</p>
      </div>

      {/* Value */}
      <div className={cn('text-3xl font-bold', colors.text)}>{value}</div>

      {/* Trend (optional) */}
      {trend && (
        <div className={cn('text-xs mt-2', colors.label)}>
          {trend.direction === 'up' && '↑ '}
          {trend.direction === 'down' && '↓ '}
          {trend.value}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}>
        {CardContent}
      </motion.div>
    );
  }

  return CardContent;
};
```

**Usage Examples:**

```tsx
// ClassHeader stats grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <StatCard
    icon={Users}
    label="Students"
    value={studentCount}
    color="primary"
  />
  <StatCard
    icon={BookOpen}
    label="Units"
    value={unitCount}
    color="secondary"
  />
  <StatCard
    icon={TrendingUp}
    label="Progress"
    value={`${progressPercentage}%`}
    color="success"
    trend={{ direction: 'up', value: '+5% this week' }}
  />
</div>

// ClassAnalytics stats grid
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatCard
    icon={Users}
    label="Students Using AI"
    value={aiInsights.totalUniqueStudents}
    color="primary"
  />
  <StatCard
    icon={MessageSquare}
    label="Total Questions"
    value={aiInsights.totalQuestions}
    color="neutral"
  />
  <StatCard
    icon={Clock}
    label="Avg. Session Time"
    value={`${aiInsights.averageSessionTime}m`}
    color="warning"
  />
  <StatCard
    icon={TrendingUp}
    label="Active This Week"
    value={aiInsights.activeThisWeek}
    color="success"
  />
</div>
```

**Migration Steps:**

```tsx
// ClassHeader.tsx (lines 83-131)
// Before: Inline stat cards
<div className="grid grid-cols-3 gap-4">
  <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-xl bg-gradient-to-br...">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-lg bg-blue-500...">
        <Users className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{studentCount}</p>
        <p className="text-sm text-gray-600">Students</p>
      </div>
    </div>
  </motion.div>
  {/* ... repeat for other stats */}
</div>

// After: StatCard component
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <StatCard icon={Users} label="Students" value={studentCount} color="primary" />
  <StatCard icon={BookOpen} label="Units" value={unitCount} color="secondary" />
  <StatCard icon={TrendingUp} label="Progress" value={`${progressPercentage}%`} color="success" />
</div>
```

**Affected Files:**
- `ClassHeader.tsx` (lines 83-131)
- `ClassAnalyticsSection.tsx` (lines 297-358)
- `TeacherClasses.tsx` (lines 246-267)
- `ClassRoster.tsx` (lines 209-226)

---

## 3. SECTION-BY-SECTION UPDATES

### 3.1 ClassHeader Component

**File:** `socratit-wireframes/src/components/class/ClassHeader.tsx`

**Current Issues:**
- Uses curriculum Button instead of common Button
- Inline stat card implementation
- Mixed color scheme (blue, purple, green)

**Required Changes:**

```tsx
// Line 9: Update import
// Before
import { Button } from '../curriculum/Button';

// After
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Card } from '../common/Card';

// Lines 33-37: Update Card wrapper
// Before
<div className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-2xl p-6 shadow-lg">

// After
<Card variant="ghost" padding="md" className="shadow-lg">

// Lines 83-131: Replace stat cards
// Before: Inline stat cards (lines 83-131)

// After
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <StatCard
    icon={Users}
    label="Students"
    value={studentCount}
    color="primary"
  />
  <StatCard
    icon={BookOpen}
    label="Units"
    value={unitCount}
    color="secondary"
  />
  <StatCard
    icon={TrendingUp}
    label="Progress"
    value={`${progressPercentage}%`}
    color="success"
  />
</div>

// Line 59: Update button props
// Before
<Button variant="secondary" onClick={onEdit} icon={<Settings className="w-4 h-4" />}>

// After
<Button variant="secondary" onClick={onEdit} icon={<Settings />}>
```

**Color Scheme Update:**
- Students: `primary` (blue)
- Units: `secondary` (purple)
- Progress: `success` (green)

---

### 3.2 CurriculumSection Component

**File:** `socratit-wireframes/src/components/class/CurriculumSection.tsx`

**Current Issues:**
- Uses CollapsibleSection (good)
- Inline card for current unit
- Mixed button styling

**Required Changes:**

```tsx
// Lines 1-10: Update imports
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { CollapsibleSection } from './CollapsibleSection';

// Lines 60-90: Update current unit card
// Before
<div
  className="p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer hover:border-blue-300 transition-colors"
  onClick={() => onUnitClick?.(currentUnit)}
>

// After
<Card
  padding="md"
  hover
  onClick={() => onUnitClick?.(currentUnit)}
  className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100"
>

// Lines 185-186: Update View All button
// Before
<button className="text-sm text-blue-600 hover:text-blue-700 font-medium">

// After
<Button variant="ghost" size="sm" onClick={onManageClick}>
  View Full Timeline
</Button>
```

---

### 3.3 RosterSection Component

**File:** `socratit-wireframes/src/components/class/RosterSection.tsx`

**Current Issues:**
- Empty state inline (lines 120-136)
- Inconsistent button usage

**Required Changes:**

```tsx
// Lines 1-10: Update imports
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { CollapsibleSection } from './CollapsibleSection';

// Lines 120-136: Replace empty state
// Before: Inline empty state

// After
<EmptyState
  icon={Users}
  title="No Students Enrolled Yet"
  message="Get started by adding students to your class. They'll receive an invitation to join."
  action={{
    label: 'Add First Student',
    onClick: onAddStudent,
    icon: UserPlus,
  }}
/>

// Lines 113-118: Update Add Student button
// Before
<Button variant="primary" onClick={onAddStudent} icon={<UserPlus className="w-4 h-4" />}>

// After
<Button variant="primary" onClick={onAddStudent} icon={<UserPlus />}>
  Add Student
</Button>

// Lines 199-202: Update View Full Roster link
// Before
<button className="text-sm text-blue-600 hover:text-blue-700 font-medium">

// After
<Button variant="ghost" size="sm" onClick={onViewFull}>
  View Full Roster ({totalEnrolled} enrolled{totalPending > 0 ? `, ${totalPending} pending` : ''}) →
</Button>
```

---

### 3.4 AssignmentsSection Component

**File:** `socratit-wireframes/src/components/class/AssignmentsSection.tsx`

**Current Issues:**
- Empty state inline (lines 67-83)
- Centered "View all" link (lines 149-154)

**Required Changes:**

```tsx
// Lines 1-10: Update imports
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { CollapsibleSection } from './CollapsibleSection';

// Lines 67-83: Replace empty state
<EmptyState
  icon={FileText}
  title="No Assignments Created Yet"
  message="Create your first assignment to engage students with interactive learning."
  action={{
    label: 'Create First Assignment',
    onClick: onCreateAssignment,
    icon: Plus,
  }}
/>

// Lines 73-77: Update Create Assignment button
<Button variant="primary" onClick={onCreateAssignment} icon={<Plus />}>
  Create Assignment
</Button>

// Lines 149-154: Update View All link
<div className="text-center pt-4">
  <Button variant="ghost" size="sm" onClick={onViewAll}>
    View All Assignments ({assignments.length}) →
  </Button>
</div>
```

---

### 3.5 ProgressSection Component

**File:** `socratit-wireframes/src/components/class/ProgressSection.tsx`

**Current Issues:**
- Mixed styling, no major issues identified

**Required Changes:**

```tsx
// Lines 1-10: Update imports
import { Button } from '../common/Button';

// Line 181: Update View Analytics button
<Button variant="ghost" onClick={onViewAnalytics} icon={<BarChart3 />}>
  View Detailed Analytics
</Button>
```

---

### 3.6 ClassAnalyticsSection Component

**File:** `socratit-wireframes/src/components/class/ClassAnalyticsSection.tsx` (26KB file)

**Current Issues:**
- Multiple empty states (lines 207-216, 518-528, 532-540)
- Inline stat cards (lines 297-358)
- Custom tab implementation (lines 160-183)

**Required Changes:**

```tsx
// Lines 1-30: Update imports
import { Button } from '../common/Button'; // Already correct
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { StatCard } from '../common/StatCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

// Lines 297-358: Replace stat cards with StatCard component
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatCard
    icon={Users}
    label="Students Using AI"
    value={aiInsights.totalUniqueStudents || 0}
    color="primary"
  />
  <StatCard
    icon={MessageSquare}
    label="Total Questions"
    value={aiInsights.totalQuestions || 0}
    color="neutral"
  />
  <StatCard
    icon={Clock}
    label="Avg. Session Time"
    value={`${aiInsights.averageSessionTime || 0}m`}
    color="warning"
  />
  <StatCard
    icon={TrendingUp}
    label="Active This Week"
    value={aiInsights.activeThisWeek || 0}
    color="success"
  />
</div>

// Lines 207-216, 518-528, 532-540: Replace all empty states
<EmptyState
  variant="subtle"
  icon={BarChart3}
  title="Analytics Not Available Yet"
  message="Performance analytics will appear once students start completing assignments."
/>

<EmptyState
  variant="subtle"
  icon={Brain}
  title="No AI Insights Yet"
  message="AI usage insights will appear when students start using the AI Tutor."
/>

// Line 289: Replace loading spinner
<LoadingSpinner size="lg" message="Loading analytics..." />
```

**Tab Navigation Note:**
The custom tab implementation (lines 160-183) is acceptable for now. Consider creating a `Tabs` component in the future for reusability.

---

### 3.7 LessonsSection Component

**File:** `socratit-wireframes/src/components/class/LessonsSection.tsx`

**Current Issues:**
- Custom header instead of SectionHeader
- Empty state with background wrapper (lines 125-136)
- Loading spinner (line 119)

**Required Changes:**

```tsx
// Lines 1-20: Update imports
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';

// Lines 78-100: Replace header with SectionHeader
<SectionHeader
  icon={BookOpen}
  title="Lesson Notes"
  subtitle={`${lessons.length} lessons recorded`}
  action={{
    label: isExpanded ? 'Hide' : 'Show',
    onClick: () => setIsExpanded(!isExpanded),
    variant: 'ghost',
  }}
/>

// Line 119: Replace loading spinner
<LoadingSpinner size="md" message="Loading lessons..." />

// Lines 125-136: Replace empty state
<EmptyState
  icon={BookOpen}
  title="No Lessons Recorded Yet"
  message="Start recording lessons to build your class knowledge base. Students can review lessons anytime."
  action={{
    label: 'Record First Lesson',
    onClick: () => {/* Handle recording */},
    icon: Mic,
  }}
/>
```

---

### 3.8 CollapsibleSection Component

**File:** `socratit-wireframes/src/components/class/CollapsibleSection.tsx`

**Current Issues:**
- Mixed with inline header pattern
- Should remain as-is but adopt standard components internally

**Required Changes:**

```tsx
// Lines 1-10: Update imports
import { Button } from '../common/Button';
import { Card } from '../common/Card';

// Lines 38-46: Update Card wrapper
// Before
<div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl overflow-hidden">

// After
<Card variant="ghost" padding="none" className="overflow-hidden">

// Lines 58-70: Update action button if present
{action && (
  <div onClick={(e) => e.stopPropagation()}>
    {action}
  </div>
)}
```

**Note:** CollapsibleSection is a good pattern. Keep it but ensure it uses standardized Card internally.

---

## 4. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Days 1-3) - P0 CRITICAL

**Goal:** Establish design system foundations and core components

#### Day 1: Design System Setup
- [ ] Update `tailwind.config.js` with color tokens
- [ ] Update `tailwind.config.js` with spacing scale
- [ ] Create `src/config/typography.config.ts`
- [ ] Create utility function `src/utils/cn.ts` for className merging
- [ ] Document color system in README

**Deliverables:**
- Color tokens ready
- Spacing system ready
- Typography config ready

#### Day 2: Core Components - Part 1
- [ ] **Button Component**
  - [ ] Merge `common/Button.tsx` and `curriculum/Button.tsx`
  - [ ] Test all variants (primary, secondary, ghost, danger, success)
  - [ ] Test all sizes (sm, md, lg)
  - [ ] Test loading state
  - [ ] Test icon positioning
- [ ] **Card Component**
  - [ ] Update `common/Card.tsx` with new variants
  - [ ] Test all variants (default, elevated, ghost)
  - [ ] Test all padding options
  - [ ] Test hover effect

**Deliverables:**
- Unified Button component
- Standardized Card component
- Component documentation

#### Day 3: Core Components - Part 2
- [ ] **EmptyState Component**
  - [ ] Create `common/EmptyState.tsx`
  - [ ] Test with icon, title, message
  - [ ] Test with primary/secondary actions
  - [ ] Test subtle variant
- [ ] **LoadingSpinner Component**
  - [ ] Create `common/LoadingSpinner.tsx`
  - [ ] Test all sizes
  - [ ] Test with/without message
- [ ] **StatCard Component**
  - [ ] Create `common/StatCard.tsx`
  - [ ] Test all color variants
  - [ ] Test with trend data
  - [ ] Test clickable state

**Deliverables:**
- EmptyState component
- LoadingSpinner component
- StatCard component

---

### Phase 2: Component Migration (Days 4-6) - P0 CRITICAL

**Goal:** Migrate all class components to use standardized components

#### Day 4: ClassHeader & CurriculumSection
- [ ] **ClassHeader.tsx**
  - [ ] Update Button imports
  - [ ] Replace inline stat cards with StatCard
  - [ ] Update Card wrapper
  - [ ] Update color scheme to use tokens
  - [ ] Test all interactive elements
- [ ] **CurriculumSection.tsx**
  - [ ] Update Button imports
  - [ ] Update current unit Card
  - [ ] Update View All button
  - [ ] Test collapsible functionality

**Testing:**
- [ ] Verify ClassHeader displays correctly
- [ ] Verify stat cards are clickable
- [ ] Verify CurriculumSection collapsing works
- [ ] Verify current unit click works

#### Day 5: RosterSection & AssignmentsSection
- [ ] **RosterSection.tsx**
  - [ ] Replace empty state with EmptyState component
  - [ ] Update Add Student button
  - [ ] Update View Full Roster link
  - [ ] Test student list rendering
- [ ] **AssignmentsSection.tsx**
  - [ ] Replace empty state with EmptyState component
  - [ ] Update Create Assignment button
  - [ ] Update View All link
  - [ ] Test assignment list rendering

**Testing:**
- [ ] Verify RosterSection empty state
- [ ] Verify RosterSection with students
- [ ] Verify AssignmentsSection empty state
- [ ] Verify AssignmentsSection with assignments

#### Day 6: ProgressSection & LessonsSection
- [ ] **ProgressSection.tsx**
  - [ ] Update View Analytics button
  - [ ] Test progress bars
  - [ ] Test student lists
- [ ] **LessonsSection.tsx**
  - [ ] Replace header with SectionHeader (optional)
  - [ ] Replace empty state
  - [ ] Replace loading spinner
  - [ ] Test lesson recording

**Testing:**
- [ ] Verify ProgressSection analytics link
- [ ] Verify LessonsSection empty state
- [ ] Verify lesson list rendering

---

### Phase 3: ClassAnalyticsSection (Days 7-8) - P1 HIGH

**Goal:** Refactor the largest component for consistency

#### Day 7: ClassAnalyticsSection - Stats & Empty States
- [ ] **ClassAnalyticsSection.tsx**
  - [ ] Replace 4 stat cards (lines 297-358) with StatCard
  - [ ] Replace 3 empty states with EmptyState
  - [ ] Replace loading spinner
  - [ ] Update Card usage
  - [ ] Test tab switching

**Testing:**
- [ ] Verify Performance tab
- [ ] Verify AI Insights tab
- [ ] Verify empty states
- [ ] Verify loading states

#### Day 8: ClassAnalyticsSection - Charts & Lists
- [ ] **ClassAnalyticsSection.tsx** (continued)
  - [ ] Verify struggling students list
  - [ ] Verify top performers list
  - [ ] Verify common questions list
  - [ ] Verify struggling concepts list
  - [ ] Test Contact Student functionality

**Testing:**
- [ ] Full ClassAnalyticsSection smoke test
- [ ] Test with mock data
- [ ] Test with empty data

---

### Phase 4: Pages & Polish (Days 9-10) - P1 HIGH

**Goal:** Update parent pages and ensure consistency

#### Day 9: ClassDashboard & ClassRoster
- [ ] **ClassDashboard.tsx**
  - [ ] Replace loading spinner
  - [ ] Update error state
  - [ ] Verify all sections render correctly
  - [ ] Test animations
- [ ] **ClassRoster.tsx**
  - [ ] Replace stat cards
  - [ ] Replace loading spinner
  - [ ] Update tab styling (if needed)
  - [ ] Test enrollment management

**Testing:**
- [ ] Full ClassDashboard integration test
- [ ] Verify all sections expand/collapse
- [ ] Verify ClassRoster tabs work
- [ ] Test add/remove student flows

#### Day 10: TeacherClasses & Final QA
- [ ] **TeacherClasses.tsx**
  - [ ] Update stat cards
  - [ ] Update class cards
  - [ ] Test grid layout
  - [ ] Test responsive design
- [ ] **Final Quality Assurance**
  - [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
  - [ ] Responsive testing (mobile, tablet, desktop)
  - [ ] Accessibility testing (keyboard navigation, screen reader)
  - [ ] Performance testing (Lighthouse)

**Testing:**
- [ ] All pages load correctly
- [ ] All interactions work
- [ ] No console errors
- [ ] Consistent styling across all pages

---

### Phase 5: Documentation & Cleanup (Post-launch)

- [ ] Create component library documentation
- [ ] Delete unused files (`curriculum/Button.tsx`)
- [ ] Update any related tests
- [ ] Create migration guide for future components
- [ ] Document design system in Storybook (optional)

---

## 5. TESTING CHECKLIST

### 5.1 Component Testing

**Button Component**
- [ ] Primary variant renders correctly
- [ ] Secondary variant renders correctly
- [ ] Ghost variant renders correctly
- [ ] Danger variant renders correctly
- [ ] Success variant renders correctly
- [ ] Small size works
- [ ] Medium size works
- [ ] Large size works
- [ ] Loading state shows spinner
- [ ] Icon renders on left
- [ ] Icon renders on right
- [ ] Disabled state works
- [ ] Click handler works
- [ ] Hover animation works
- [ ] Keyboard navigation (Tab, Enter, Space)

**Card Component**
- [ ] Default variant renders
- [ ] Elevated variant shows shadow
- [ ] Ghost variant has backdrop blur
- [ ] No padding works
- [ ] Small padding works
- [ ] Medium padding works
- [ ] Large padding works
- [ ] Hover effect works (when enabled)

**EmptyState Component**
- [ ] Icon displays correctly
- [ ] Title displays correctly
- [ ] Message displays correctly
- [ ] Primary action button works
- [ ] Secondary action button works
- [ ] Subtle variant styling works

**LoadingSpinner Component**
- [ ] Small spinner renders
- [ ] Medium spinner renders
- [ ] Large spinner renders
- [ ] XL spinner renders
- [ ] Message displays below spinner
- [ ] Animation is smooth

**StatCard Component**
- [ ] All color variants render correctly
- [ ] Icon displays in container
- [ ] Label displays correctly
- [ ] Value displays with correct formatting
- [ ] Trend indicator shows (when provided)
- [ ] Click handler works (when clickable)
- [ ] Hover animation works (when clickable)

---

### 5.2 Section Testing

**ClassHeader**
- [ ] Class name displays
- [ ] Subject and grade display
- [ ] Class code displays (if available)
- [ ] Student count stat card works
- [ ] Unit count stat card works
- [ ] Progress stat card works
- [ ] Edit button works
- [ ] Responsive layout on mobile

**CurriculumSection**
- [ ] Section expands/collapses
- [ ] Current unit displays
- [ ] Current unit is clickable
- [ ] Upcoming units display (up to 3)
- [ ] View Full Timeline button works
- [ ] Empty state shows (when no curriculum)

**RosterSection**
- [ ] Section expands/collapses
- [ ] Student list displays
- [ ] Pending enrollments show
- [ ] Add Student button works
- [ ] View Full Roster link works
- [ ] Empty state shows (when no students)

**AssignmentsSection**
- [ ] Section expands/collapses
- [ ] Assignment list displays
- [ ] Submission status shows
- [ ] Assignment click navigation works
- [ ] Create Assignment button works
- [ ] View All link works
- [ ] Empty state shows (when no assignments)

**ProgressSection**
- [ ] Class average displays
- [ ] Struggling students list shows
- [ ] Top performers list shows
- [ ] View Analytics button works
- [ ] Student click handler works

**ClassAnalyticsSection**
- [ ] Performance tab shows correctly
- [ ] AI Insights tab shows correctly
- [ ] Tab switching works
- [ ] All 4 stat cards display
- [ ] Struggling students chart renders
- [ ] Top performers chart renders
- [ ] Common questions list renders
- [ ] Struggling concepts list renders
- [ ] Contact student button works
- [ ] Empty states show (when no data)
- [ ] Loading state shows while fetching

**LessonsSection**
- [ ] Section expands/collapses
- [ ] Lesson list displays
- [ ] Audio player works
- [ ] Lesson click opens details
- [ ] Empty state shows (when no lessons)

---

### 5.3 Page Testing

**ClassDashboard**
- [ ] Loading state shows while fetching data
- [ ] Error state shows on failure
- [ ] All sections render correctly
- [ ] Section animations work smoothly
- [ ] Modals open/close correctly (Curriculum, Unit Details)
- [ ] Navigation to other pages works
- [ ] Responsive layout on all screen sizes

**ClassRoster**
- [ ] Enrolled tab shows students
- [ ] Pending tab shows requests
- [ ] Invited tab shows invitations
- [ ] Stat cards display correctly
- [ ] Add Students modal works
- [ ] Approve/reject enrollment works
- [ ] Search/filter works
- [ ] Responsive layout

**TeacherClasses**
- [ ] All classes display in grid
- [ ] Class cards show correct info
- [ ] Stat summary at top shows
- [ ] Create Class button works
- [ ] Class click navigation works
- [ ] Responsive grid layout

---

### 5.4 Accessibility Testing

- [ ] All buttons have accessible names
- [ ] All icons have aria-labels (where needed)
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Screen reader announces sections correctly
- [ ] Modals trap focus
- [ ] Escape key closes modals

---

### 5.5 Responsive Testing

**Mobile (375px - 767px)**
- [ ] Sidebar collapses to hamburger menu
- [ ] Stat cards stack vertically
- [ ] Section headers wrap correctly
- [ ] Buttons are large enough (44x44px min)
- [ ] Text is readable
- [ ] No horizontal scroll

**Tablet (768px - 1023px)**
- [ ] Stat cards use 2-column grid
- [ ] Sidebar shows collapsed by default
- [ ] All sections fit on screen
- [ ] Touch targets are adequate

**Desktop (1024px+)**
- [ ] Full layout displays
- [ ] Stat cards use full grid (3-4 columns)
- [ ] Sidebar shows expanded
- [ ] Optimal spacing and padding

---

### 5.6 Performance Testing

- [ ] Lighthouse Performance score > 90
- [ ] Lighthouse Accessibility score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Animations are smooth (60fps)

---

## 6. SUCCESS METRICS

### 6.1 Before vs After Comparison

| Metric | Before | After (Target) |
|--------|--------|----------------|
| **Consistency** |
| Button components | 2 incompatible | 1 unified |
| Card implementations | 4+ variations | 1 standardized |
| Empty states | 4+ variations | 1 component |
| Loading spinners | 4+ variations | 1 component |
| Stat cards | 4 implementations | 1 component |
| Color usage | 15+ inline colors | Semantic tokens |
| **Code Quality** |
| Lines of code | ~5,000 | ~3,500 (-30%) |
| Code duplication | High | Minimal |
| Component reusability | Low | High |
| **User Experience** |
| Visual consistency | 5/10 | 9/10 |
| Loading experience | 6/10 | 9/10 |
| Empty states | 5/10 | 9/10 |
| Navigation clarity | 7/10 | 9/10 |
| **Performance** |
| Lighthouse score | ~85 | >90 |
| Bundle size | Baseline | -10% (less duplication) |
| **Maintainability** |
| Time to add new section | 4 hours | 1 hour (-75%) |
| Onboarding new developer | 2 days | 4 hours |

---

### 6.2 Key Performance Indicators (KPIs)

**Code Quality Metrics**
- [ ] 100% of class components use standardized Button
- [ ] 100% of class components use standardized Card
- [ ] 100% of empty states use EmptyState component
- [ ] 100% of loading states use LoadingSpinner
- [ ] 0 instances of `bg-blue-500` (replaced with `bg-primary-500`)
- [ ] 0 instances of inline card styling

**User Experience Metrics**
- [ ] All stat cards have consistent styling
- [ ] All section headers have consistent layout
- [ ] All empty states have helpful CTAs
- [ ] All buttons have consistent hover effects
- [ ] All modals have consistent styling

**Accessibility Metrics**
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] All color contrasts meet WCAG AA
- [ ] All interactive elements keyboard-accessible
- [ ] All images/icons have alt text or aria-labels

**Performance Metrics**
- [ ] Lighthouse Performance score ≥ 90
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] No console errors or warnings

---

## 7. ROLLBACK PLAN

If critical issues arise during implementation:

1. **Create feature branch**: `feature/class-ui-consistency`
2. **Test thoroughly** before merging to main
3. **Tag release**: Before merging, tag current main as `v1.0-pre-consistency`
4. **Merge gradually**: Merge components one by one, not all at once
5. **Monitor production**: After deployment, monitor for 24 hours
6. **Rollback if needed**: Revert to `v1.0-pre-consistency` tag

**Rollback Command:**
```bash
git checkout main
git reset --hard v1.0-pre-consistency
git push --force
```

---

## 8. FILES TO MODIFY

### New Files to Create (6 files)

1. `socratit-wireframes/src/components/common/EmptyState.tsx`
2. `socratit-wireframes/src/components/common/LoadingSpinner.tsx`
3. `socratit-wireframes/src/components/common/StatCard.tsx`
4. `socratit-wireframes/src/components/common/SectionHeader.tsx` (optional)
5. `socratit-wireframes/src/config/typography.config.ts`
6. `socratit-wireframes/src/utils/cn.ts`

### Files to Update (15+ files)

**Core Components:**
1. `socratit-wireframes/src/components/common/Button.tsx` (merge with curriculum)
2. `socratit-wireframes/src/components/common/Card.tsx` (enhance)
3. `socratit-wireframes/tailwind.config.js` (add tokens)

**Class Components:**
4. `socratit-wireframes/src/components/class/ClassHeader.tsx`
5. `socratit-wireframes/src/components/class/CurriculumSection.tsx`
6. `socratit-wireframes/src/components/class/RosterSection.tsx`
7. `socratit-wireframes/src/components/class/AssignmentsSection.tsx`
8. `socratit-wireframes/src/components/class/ProgressSection.tsx`
9. `socratit-wireframes/src/components/class/ClassAnalyticsSection.tsx`
10. `socratit-wireframes/src/components/class/LessonsSection.tsx`
11. `socratit-wireframes/src/components/class/CollapsibleSection.tsx`

**Pages:**
12. `socratit-wireframes/src/pages/teacher/ClassDashboard.tsx`
13. `socratit-wireframes/src/pages/teacher/ClassRoster.tsx`
14. `socratit-wireframes/src/pages/teacher/TeacherClasses.tsx`

### Files to Delete (1 file)

1. `socratit-wireframes/src/components/curriculum/Button.tsx` (after migration)

---

## 9. MIGRATION GUIDE FOR DEVELOPERS

### Quick Reference: Component Replacements

```tsx
// ❌ OLD: Inline card styling
<div className="bg-white border border-gray-200 rounded-xl p-6">
  Content
</div>

// ✅ NEW: Card component
<Card>
  Content
</Card>

// ❌ OLD: Inline empty state
<div className="text-center py-8">
  <div className="w-16 h-16 rounded-full bg-gray-100...">
    <Icon />
  </div>
  <p>No items yet</p>
  <button>Add Item</button>
</div>

// ✅ NEW: EmptyState component
<EmptyState
  icon={Icon}
  title="No Items Yet"
  message="Get started by adding your first item."
  action={{ label: 'Add Item', onClick: handleAdd, icon: Plus }}
/>

// ❌ OLD: Inline loading spinner
<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

// ✅ NEW: LoadingSpinner component
<LoadingSpinner size="lg" message="Loading..." />

// ❌ OLD: Inline stat card
<div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-blue-500 rounded-lg">
      <Icon />
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm">Label</p>
    </div>
  </div>
</div>

// ✅ NEW: StatCard component
<StatCard icon={Icon} label="Label" value={value} color="primary" />

// ❌ OLD: Inline colors
<div className="bg-blue-500 text-gray-900 border-purple-600">

// ✅ NEW: Semantic tokens
<div className="bg-primary-500 text-neutral-900 border-secondary-600">
```

---

## 10. TROUBLESHOOTING GUIDE

### Common Issues During Migration

**Issue 1: Button prop mismatch**
```
Error: Unknown prop 'isLoading'
```
**Solution:** Replace `isLoading` with `loading`

**Issue 2: Icon sizing issues**
```
Icons appear too large or small
```
**Solution:** Remove explicit `w-4 h-4` from icon elements, Button handles sizing

**Issue 3: Card variant not working**
```
Card doesn't have backdrop blur
```
**Solution:** Use `variant="ghost"` for glassmorphism effect

**Issue 4: Color not updating**
```
Old blue-500 colors still showing
```
**Solution:** Replace with `primary-500` and ensure tailwind.config.js is updated

**Issue 5: StatCard not rendering**
```
StatCard shows undefined value
```
**Solution:** Ensure `value` prop is string or number, not undefined

---

## CONCLUSION

This plan provides a comprehensive roadmap to achieve **100% UI consistency** across all class-related pages in Socratit.ai. By following this 10-day implementation schedule, we will:

1. **Eliminate duplication**: Merge 2 Button components into 1
2. **Standardize patterns**: Create 6 reusable components used across 15+ files
3. **Improve maintainability**: Reduce code by ~30%, use semantic tokens
4. **Enhance UX**: Consistent styling, better empty/loading states
5. **Future-proof**: Design system foundation for new features

**Next Steps:**
1. Review this plan with team
2. Create feature branch: `feature/class-ui-consistency`
3. Begin Phase 1 (Days 1-3) immediately
4. Daily stand-ups to track progress
5. Deploy to staging after Phase 4
6. User acceptance testing before production

---

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Status:** Ready for Implementation
**Estimated Effort:** 60-80 developer hours (10 working days)
