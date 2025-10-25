// ============================================================================
// ANALYTICS TYPE DEFINITIONS
// TypeScript types for Analytics & Insights (Batch 5)
// ============================================================================

export type MasteryLevel = 'NOT_STARTED' | 'BEGINNING' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';
export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ConceptMastery {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;
  concept: string;
  subject?: string;
  masteryLevel: MasteryLevel;
  masteryPercent: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  trend: TrendDirection;
  previousPercent?: number;
  weightedScore?: number;
  lastAssessed?: string;
  firstAssessed?: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    subject?: string;
  };
}

export interface StudentInsight {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;
  isStruggling: boolean;
  hasMissedAssignments: boolean;
  hasDecliningGrade: boolean;
  hasLowEngagement: boolean;
  hasConceptGaps: boolean;
  completionRate?: number;
  averageScore?: number;
  classRank?: number;
  percentile?: number;
  avgTimeOnTask?: number;
  totalTimeSpent?: number;
  strugglingConcepts?: Array<{ concept: string; mastery: number }>;
  masteredConcepts?: Array<{ concept: string; mastery: number }>;
  recommendations?: any;
  interventionLevel: AlertSeverity;
  teacherNotes?: string;
  alertSent: boolean;
  alertSentAt?: string;
  alertDismissed: boolean;
  lastCalculated: string;
  dataPoints: number;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    subject?: string;
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  // Nested insights object for component compatibility
  insights?: {
    isStruggling: boolean;
    hasMissedAssignments: boolean;
    hasDecliningGrade: boolean;
    hasConceptGaps: boolean;
  };
  // Performance metrics for student analytics page
  performanceMetrics?: {
    overallGrade: number;
    completionRate: number;
    classRank: number;
    avgStreakDays: number;
    totalTimeSpent: number;
  };
}

export interface ClassOverview {
  totalStudents: number;
  averageGrade: number;
  passingRate: number;
  strugglingCount: number;
  improvingCount: number;
  decliningCount: number;
  averageCompletionRate: number;
  avgCompletionRate: number; // Alternative name for compatibility
  avgScore: number;
  interventionLevels: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  topConcepts?: Array<{ concept: string; averageMastery: number }>;
  strugglingConcepts?: Array<{ concept: string; averageMastery: number }>;
}

// Struggling student type for teacher dashboards
export interface StrugglingStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  interventionLevel: AlertSeverity;
  averageScore?: number;
  completionRate?: number;
  hasMissedAssignments: boolean;
  hasDecliningGrade: boolean;
  hasConceptGaps: boolean;
  hasLowEngagement: boolean;
  strugglingConcepts?: string[];
  recommendations?: string[];
  lastActivityDate?: string;
  classId?: string;
  className?: string;
}

// Helper function to get mastery level color
export function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case 'MASTERED':
      return 'green';
    case 'PROFICIENT':
      return 'blue';
    case 'DEVELOPING':
      return 'yellow';
    case 'BEGINNING':
      return 'orange';
    default:
      return 'gray';
  }
}

// Helper function to get alert severity color
export function getAlertColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'red';
    case 'HIGH':
      return 'orange';
    case 'MEDIUM':
      return 'yellow';
    default:
      return 'blue';
  }
}

// Helper function to format mastery level for display
export function formatMasteryLevel(level: MasteryLevel): string {
  return level.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

// Helper function to format alert severity for display
export function formatAlertSeverity(severity: AlertSeverity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
}

// ============================================================================
// BATCH 7 - EXTENDED ANALYTICS TYPES
// ============================================================================

export interface TimelineDataPoint {
  date: string;
  averageScore: number;
  assignmentCount: number;
  timeSpent: number;
}

export interface ConceptComparison {
  concept: string;
  studentMastery: number;
  classAverage: number;
  percentile: number;
  trend: TrendDirection;
}

export interface AssignmentTypeBreakdown {
  type: string;
  averageScore: number;
  completionRate: number;
  totalAssignments: number;
  completedAssignments: number;
}

export interface PerformanceDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface DistributionStats {
  distribution: PerformanceDistribution[];
  median: number;
  mean: number;
  stdDev: number;
  totalStudents: number;
}

export interface ConceptHeatmapStudent {
  studentId: string;
  studentName: string;
  masteryLevel: MasteryLevel;
  masteryPercent: number;
}

export interface ConceptHeatmapData {
  concept: string;
  subject: string;
  studentMasteryLevels: ConceptHeatmapStudent[];
  classAverage: number;
}

export interface EngagementMetrics {
  avgTimeSpent: number;
  completionRate: number;
  activeStudents: number;
  inactiveStudents: number;
  totalStudents: number;
  avgStreakDays: number;
}

export interface AssignmentPerformanceData {
  assignmentId: string;
  title: string;
  assignmentType: string;
  avgScore: number;
  completionRate: number;
  submissionCount: number;
  totalStudents: number;
}

export interface ClassComparisonData {
  classId: string;
  className: string;
  teacherName: string;
  avgGrade: number;
  totalStudents: number;
  completionRate: number;
  strugglingCount: number;
  activeStudents: number;
}

export interface RecommendationActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact?: string;
}

export interface RecommendationData {
  recommendations: string[];
  actionItems: RecommendationActionItem[];
  focus: string;
}

export interface AnalyticsEventData {
  eventType: string;
  eventData?: any;
  assignmentId?: string;
  submissionId?: string;
  questionId?: string;
}

export interface StudentReportExport {
  student: {
    id: string;
    name: string;
    email: string;
  };
  performance: {
    overallGrade: number;
    completionRate: number;
    classRank: number;
    percentile: number;
    totalTimeSpent: number;
    avgTimeOnTask: number;
  };
  indicators: {
    isStruggling: boolean;
    hasMissedAssignments: boolean;
    hasDecliningGrade: boolean;
    hasLowEngagement: boolean;
    hasConceptGaps: boolean;
    interventionLevel: string;
  };
  conceptMastery: Array<{
    concept: string;
    subject: string | null;
    masteryLevel: string;
    masteryPercent: number;
    totalAttempts: number;
    correctAttempts: number;
    trend: string;
  }>;
  submissions: Array<{
    assignmentTitle: string;
    assignmentType: string;
    status: string;
    percentage: number | null;
    submittedAt: string | null;
    timeSpent: number | null;
  }>;
  recommendations: any;
  lastCalculated: string;
  generatedAt: string;
}

// Helper function to get mastery percent color
export function getMasteryPercentColor(percent: number): string {
  if (percent >= 90) return 'green';
  if (percent >= 70) return 'blue';
  if (percent >= 40) return 'yellow';
  if (percent >= 20) return 'orange';
  return 'red';
}

// Helper function to format time spent
export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Assignment Performance Detail Type (used in tables)
export interface AssignmentPerformanceDetail {
  assignmentId: string;
  title: string;
  type: string;
  avgScore: number;
  completionRate: number;
  submissionCount: number;
  totalStudents: number;
  timeSpent?: number;
  // Alternative property names for compatibility
  assignmentTitle?: string;
  assignmentType?: string;
  submittedCount?: number;
  avgTimeSpent?: number;
  highestScore?: number;
  lowestScore?: number;
}

// Teacher Note Type
export interface TeacherNote {
  id: string;
  studentId: string;
  teacherId: string;
  classId: string;
  note: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics Event Type (alias for AnalyticsEventData)
export type AnalyticsEvent = AnalyticsEventData;
