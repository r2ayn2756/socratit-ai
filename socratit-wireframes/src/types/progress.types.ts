// ============================================================================
// PROGRESS TRACKING TYPES
// Type definitions for Progress Tracking system (Batch 8)
// ============================================================================

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING';
export type SubmissionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
export type MasteryLevel = 'NOT_STARTED' | 'BEGINNING' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';

// ============================================================================
// STUDENT PROGRESS
// ============================================================================

export interface StudentProgress {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;

  // Completion metrics
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  notStartedAssignments: number;
  completionRate: number; // percentage

  // Grade trends
  averageGrade: number | null;
  trendDirection: TrendDirection;
  trendPercentage: number | null;

  // Time metrics
  totalTimeSpent: number; // minutes
  averageTimePerAssignment: number | null; // minutes

  // Learning velocity
  learningVelocity: number; // assignments per week

  // Timestamps
  lastCalculated: string;
  createdAt: string;
  updatedAt: string;

  // Optional relations
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
    subject: string | null;
    gradeLevel: string | null;
  };
}

// ============================================================================
// ASSIGNMENT PROGRESS
// ============================================================================

export interface AssignmentProgress {
  id: string;
  studentId: string;
  assignmentId: string;
  classId: string;
  schoolId: string;

  // Status tracking
  status: SubmissionStatus;

  // Progress metrics
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
  progressPercentage: number;

  // Time tracking
  timeSpent: number; // minutes
  startedAt: string | null;
  completedAt: string | null;

  // Attempt tracking
  attemptCount: number;
  lastAttemptAt: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Optional relations
  assignment?: {
    id: string;
    title: string;
    type: string;
    dueDate: string | null;
    totalPoints: number;
  };
  class?: {
    id: string;
    name: string;
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ============================================================================
// CONCEPT MASTERY
// ============================================================================

export interface ConceptMastery {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;

  // Concept details
  concept: string;
  subject: string | null;

  // Mastery metrics
  masteryLevel: MasteryLevel;
  masteryPercent: number; // 0-100

  // Attempt statistics
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;

  // Trend analysis
  trend: TrendDirection;
  previousPercent: number | null;

  // Difficulty-weighted score
  weightedScore: number | null;

  // Prerequisite tracking
  prerequisites: string[];
  recommendedNext: string[];

  // Progression tracking
  lastPracticed: string | null;
  practiceCount: number;
  improvementRate: number | null;
  suggestedNextConcepts: string[];
  remediationNeeded: boolean;

  // Timestamps
  lastAssessed: string | null;
  firstAssessed: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CONCEPT MASTERY PATH
// ============================================================================

export interface ConceptMasteryPath {
  id: string;
  classId: string;
  schoolId: string;
  conceptName: string;
  prerequisiteId: string | null;

  // Metadata
  orderIndex: number;
  difficulty: number; // 1-5 scale
  estimatedHours: number | null;
  description: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Optional relations
  prerequisite?: {
    conceptName: string;
    orderIndex: number;
  } | null;
}

// ============================================================================
// LEARNING VELOCITY LOG
// ============================================================================

export interface LearningVelocityLog {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;

  // Velocity metrics
  weekStartDate: string;
  weekEndDate: string;
  assignmentsCompleted: number;
  velocity: number; // assignments per week

  // Quality metrics
  averageScore: number | null;
  timeSpentMinutes: number;

  // Trend indicators
  velocityChange: number | null; // percentage change from previous week

  // Timestamps
  createdAt: string;

  // Optional relations
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ============================================================================
// PROGRESS TRENDS
// ============================================================================

export interface ProgressTrends {
  currentProgress: StudentProgress;
  historicalGrades: {
    percentage: number | null;
    gradedAt: string | null;
    assignment: {
      title: string;
      type: string;
    };
  }[];
}

export interface ClassProgressTrends {
  students: StudentProgress[];
  classAverages: {
    averageGrade: number;
    averageCompletionRate: number;
    improvingCount: number;
    decliningCount: number;
    stableCount: number;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateConceptPathRequest {
  classId: string;
  conceptName: string;
  prerequisiteId?: string;
  orderIndex: number;
  difficulty?: number;
  estimatedHours?: number;
  description?: string;
}

export interface UpdateConceptPathRequest {
  conceptName?: string;
  prerequisiteId?: string;
  orderIndex?: number;
  difficulty?: number;
  estimatedHours?: number;
  description?: string;
}

export interface UpdateTimeSpentRequest {
  timeSpentMinutes: number;
}

export interface GetAssignmentProgressParams {
  classId?: string;
  status?: SubmissionStatus;
}

export interface GetLearningVelocityParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ============================================================================
// WEBSOCKET EVENT PAYLOADS
// ============================================================================

export interface ProgressUpdateEvent {
  studentId: string;
  classId: string;
  progress: StudentProgress | AssignmentProgress;
}

export interface ConceptMasteryEvent {
  studentId: string;
  classId: string;
  conceptId: string;
  masteryLevel: number;
  remediationNeeded: boolean;
}

export interface VelocityAlertEvent {
  studentId: string;
  classId: string;
  currentVelocity: number;
  previousVelocity: number;
  change: number; // percentage
}
