// ============================================================================
// CURRICULUM CONFIGURATION
// Constants and configuration for curriculum UI
// ============================================================================

import type {
  DifficultyLevel,
  UnitType,
  UnitProgressStatus,
  DifficultyConfig,
  UnitTypeConfig,
  ProgressStatusConfig,
} from '../types/curriculum.types';

// ============================================================================
// DIFFICULTY LEVELS
// ============================================================================

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  1: {
    level: 1,
    label: 'Beginner',
    color: 'emerald',
    description: 'Introductory content, foundational concepts',
  },
  2: {
    level: 2,
    label: 'Easy',
    color: 'green',
    description: 'Basic concepts with simple applications',
  },
  3: {
    level: 3,
    label: 'Moderate',
    color: 'yellow',
    description: 'Intermediate concepts requiring more effort',
  },
  4: {
    level: 4,
    label: 'Challenging',
    color: 'orange',
    description: 'Advanced concepts with complex applications',
  },
  5: {
    level: 5,
    label: 'Advanced',
    color: 'red',
    description: 'Expert-level content, significant challenge',
  },
};

// ============================================================================
// UNIT TYPES
// ============================================================================

export const UNIT_TYPE_CONFIGS: Record<UnitType, UnitTypeConfig> = {
  CORE: {
    type: 'CORE',
    label: 'Core Unit',
    icon: '📚',
    color: 'blue',
    description: 'Essential curriculum content',
  },
  ENRICHMENT: {
    type: 'ENRICHMENT',
    label: 'Enrichment',
    icon: '✨',
    color: 'purple',
    description: 'Supplementary advanced topics',
  },
  REVIEW: {
    type: 'REVIEW',
    label: 'Review',
    icon: '🔄',
    color: 'gray',
    description: 'Consolidation and practice',
  },
  ASSESSMENT: {
    type: 'ASSESSMENT',
    label: 'Assessment',
    icon: '📝',
    color: 'indigo',
    description: 'Testing and evaluation',
  },
  PROJECT: {
    type: 'PROJECT',
    label: 'Project',
    icon: '🎨',
    color: 'pink',
    description: 'Hands-on application project',
  },
  OPTIONAL: {
    type: 'OPTIONAL',
    label: 'Optional',
    icon: '⭐',
    color: 'amber',
    description: 'Additional optional content',
  },
};

// ============================================================================
// PROGRESS STATUSES
// ============================================================================

export const PROGRESS_STATUS_CONFIGS: Record<UnitProgressStatus, ProgressStatusConfig> = {
  NOT_STARTED: {
    status: 'NOT_STARTED',
    label: 'Not Started',
    color: 'gray',
    icon: '⭕',
    description: 'No progress yet',
  },
  IN_PROGRESS: {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'blue',
    icon: '⏳',
    description: 'Currently working on this unit',
  },
  REVIEW_NEEDED: {
    status: 'REVIEW_NEEDED',
    label: 'Needs Review',
    color: 'yellow',
    icon: '⚠️',
    description: 'Performance below target',
  },
  COMPLETED: {
    status: 'COMPLETED',
    label: 'Completed',
    color: 'green',
    icon: '✅',
    description: 'All work completed',
  },
  MASTERED: {
    status: 'MASTERED',
    label: 'Mastered',
    color: 'emerald',
    icon: '🏆',
    description: 'Excellent performance',
  },
};

// ============================================================================
// COLOR PALETTES (Apple-inspired)
// ============================================================================

export const COLORS = {
  // Primary colors
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
  // Glass morphism
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    medium: 'rgba(255, 255, 255, 0.5)',
    dark: 'rgba(255, 255, 255, 0.3)',
  },
  // Shadows for depth
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const LAYOUT = {
  // Unit card dimensions
  unitCard: {
    minHeight: 200,
    maxHeight: 400,
    width: 320,
  },
  // Timeline
  timeline: {
    rowHeight: 60,
    dayWidth: 40,
    weekWidth: 200,
  },
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  // Border radius (Apple-style)
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
};

// ============================================================================
// WIZARD CONFIGURATION
// ============================================================================

export const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Class Selection',
    description: 'Choose the class for this curriculum',
  },
  {
    id: 2,
    title: 'School Year',
    description: 'Set the school year dates',
  },
  {
    id: 3,
    title: 'Curriculum Upload',
    description: 'Upload curriculum materials',
  },
  {
    id: 4,
    title: 'AI Generation',
    description: 'Generate schedule with AI',
  },
  {
    id: 5,
    title: 'Review & Adjust',
    description: 'Fine-tune your schedule',
  },
  {
    id: 6,
    title: 'Publish',
    description: 'Publish to students',
  },
];

// ============================================================================
// DATE FORMAT
// ============================================================================

export const DATE_FORMATS = {
  display: 'MMM d, yyyy',
  displayLong: 'MMMM d, yyyy',
  displayShort: 'M/d/yy',
  input: 'yyyy-MM-dd',
  time: 'h:mm a',
  dateTime: 'MMM d, yyyy h:mm a',
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  schedule: {
    title: {
      minLength: 3,
      maxLength: 200,
    },
    description: {
      maxLength: 2000,
    },
    schoolYear: {
      minDays: 150,
      maxDays: 365,
    },
  },
  unit: {
    title: {
      minLength: 3,
      maxLength: 200,
    },
    description: {
      maxLength: 2000,
    },
    duration: {
      minDays: 3,
      maxDays: 90,
    },
    topics: {
      min: 1,
      max: 10,
    },
  },
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  enableAI: true,
  enableDragDrop: true,
  enableCalendarView: true,
  enableProgressTracking: true,
  enableNotifications: true,
};
