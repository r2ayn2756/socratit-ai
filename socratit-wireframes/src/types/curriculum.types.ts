// ============================================================================
// CURRICULUM MAPPING TYPES
// TypeScript types for frontend curriculum scheduling
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type ScheduleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type UnitType = 'CORE' | 'ENRICHMENT' | 'REVIEW' | 'ASSESSMENT' | 'PROJECT' | 'OPTIONAL';
export type UnitStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'POSTPONED';
export type UnitProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW_NEEDED' | 'COMPLETED' | 'MASTERED';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type PacingPreference = 'standard' | 'accelerated' | 'extended';
export type SuggestionType = 'PACING' | 'DIFFICULTY' | 'SEQUENCING' | 'ASSESSMENT' | 'REVIEW';
export type SuggestionPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type AssignmentType = 'QUIZ' | 'HOMEWORK' | 'TEST' | 'PROJECT';
export type AssignmentTiming = 'beginning' | 'middle' | 'end';

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface UnitTopic {
  name: string;
  subtopics: string[];
  concepts: string[];
  learningObjectives: string[];
}

export interface CurriculumSubUnit {
  id: string;
  unitId: string;
  name: string;
  description?: string;
  orderIndex: number;
  concepts: string[];
  learningObjectives: string[];
  estimatedHours: number;
  performancePercentage?: number;
  aiGenerated: boolean;
  teacherModified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumSchedule {
  id: string;
  classId: string;
  teacherId: string;
  schoolId: string;
  title: string;
  description?: string;
  schoolYearStart: string;
  schoolYearEnd: string;
  totalWeeks: number;
  totalDays: number;
  status: ScheduleStatus;
  currentUnitId?: string;
  completedUnits: number;
  totalUnits: number;
  percentComplete: number;
  aiGenerated: boolean;
  aiConfidence?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  deletedAt?: string;
  units?: CurriculumUnit[]; // Units may be included in API response
}

export interface CurriculumUnit {
  id: string;
  scheduleId: string;
  title: string;
  description?: string;
  unitNumber: number;
  orderIndex: number;
  startDate: string;
  endDate: string;
  estimatedWeeks: number;
  estimatedHours?: number;
  difficultyLevel: DifficultyLevel;
  difficultyReasoning?: string;
  unitType: UnitType;
  status: UnitStatus;
  topics: UnitTopic[];
  subUnits?: CurriculumSubUnit[]; // New: Sub-units within this unit
  learningObjectives: string[];
  concepts: string[];
  suggestedAssessments?: any[];
  prerequisiteUnits?: string[];
  buildUponTopics?: string[];
  percentComplete: number;
  aiGenerated: boolean;
  aiConfidence?: number;
  teacherModified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitProgress {
  id: string;
  unitId: string;
  studentId: string;
  classId: string;
  status: UnitProgressStatus;
  percentComplete: number;
  assignmentsTotal: number;
  assignmentsCompleted: number;
  assignmentsScore: number;
  conceptsTotal: number;
  conceptsMastered: number;
  masteryPercentage: number;
  timeSpentMinutes: number;
  firstAccessedAt?: string;
  lastAccessedAt?: string;
  completedAt?: string;
  strengths: string[];
  struggles: string[];
  recommendedReview: string[];
  engagementScore?: number;
  participationCount: number;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateScheduleRequest {
  classId: string;
  schoolYearStart: string;
  schoolYearEnd: string;
  meetingPattern?: string;
  title: string;
  description?: string;
  curriculumMaterialId?: string;
}

export interface UpdateScheduleRequest {
  title?: string;
  description?: string;
  schoolYearStart?: string;
  schoolYearEnd?: string;
  status?: ScheduleStatus;
}

export interface GenerateScheduleFromAIRequest {
  curriculumMaterialId: string;
  preferences?: {
    targetUnits?: number;
    pacingPreference?: PacingPreference;
    includeReviewUnits?: boolean;
    breakDates?: string[];
  };
}

export interface RefineScheduleWithAIRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface CreateUnitRequest {
  scheduleId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  topics: UnitTopic[];
  difficultyLevel: DifficultyLevel;
  unitType?: UnitType;
  isOptional?: boolean;
}

export interface UpdateUnitRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  topics?: UnitTopic[];
  difficultyLevel?: DifficultyLevel;
  unitType?: UnitType;
  status?: UnitStatus;
}

export interface ReorderUnitsRequest {
  scheduleId: string;
  unitOrders: Array<{
    unitId: string;
    orderIndex: number;
    startDate?: string;
    endDate?: string;
  }>;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ScheduleResponse {
  id: string;
  class: {
    id: string;
    name: string;
    subject: string;
  };
  schoolYearStart: string;
  schoolYearEnd: string;
  totalWeeks: number;
  totalDays: number;
  status: ScheduleStatus;
  currentUnit?: {
    id: string;
    title: string;
    unitNumber: number;
  };
  completedUnits: number;
  totalUnits: number;
  percentComplete: number;
  units: UnitResponse[];
  createdAt: string;
  publishedAt?: string;
}

export interface UnitResponse {
  id: string;
  title: string;
  description?: string;
  unitNumber: number;
  startDate: string;
  endDate: string;
  estimatedWeeks: number;
  status: UnitStatus;
  difficultyLevel: DifficultyLevel;
  unitType: UnitType;
  topics: UnitTopic[];
  learningObjectives: string[];
  concepts: string[];
  percentComplete: number;
  assignments?: any[];
  progress?: {
    studentsStarted: number;
    studentsCompleted: number;
    averageProgress: number;
  };
}

export interface AIScheduleResponse {
  scheduleId: string;
  units: Array<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    estimatedWeeks: number;
    difficultyLevel: DifficultyLevel;
    topics: UnitTopic[];
    aiConfidence: number;
  }>;
  metadata: {
    totalUnits: number;
    estimatedTotalWeeks: number;
    difficultyProgression: string;
  };
}

export interface AIRefinementResponse {
  response: string;
  suggestedChanges: Array<{
    unitId: string;
    unitTitle: string;
    field: string;
    currentValue: any;
    suggestedValue: any;
    reasoning: string;
  }>;
  previewSchedule?: {
    units: Array<{
      id: string;
      title: string;
      startDate: string;
      endDate: string;
    }>;
  };
}

export interface AISuggestionsResponse {
  suggestions: Array<{
    type: SuggestionType;
    title: string;
    description: string;
    affectedUnits: string[];
    suggestedAction: string;
    priority: SuggestionPriority;
  }>;
}

export interface SuggestedAssignment {
  type: AssignmentType;
  title: string;
  description: string;
  suggestedTiming: AssignmentTiming;
  suggestedDate: string;
  topicsCovered: string[];
  estimatedQuestions: number;
}

export interface SuggestedAssignmentsResponse {
  suggestions: SuggestedAssignment[];
}

export interface StudentUnitProgressResponse {
  scheduleId: string;
  scheduleTitle: string;
  studentId: string;
  overallProgress: {
    totalUnits: number;
    unitsStarted: number;
    unitsCompleted: number;
    unitsMastered: number;
    percentComplete: number;
    averageScore: number;
    currentUnitId?: string;
    currentUnitTitle?: string;
  };
  unitProgress: Array<{
    unitId: string;
    unitNumber: number;
    title: string;
    startDate: string;
    endDate: string;
    status: UnitProgressStatus;
    percentComplete: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    assignmentsScore: number;
    conceptsMastered: number;
    conceptsTotal: number;
    masteryPercentage: number;
    timeSpentMinutes: number;
    lastAccessedAt?: string;
  }>;
  insights: {
    strengths: string[];
    struggles: string[];
    recommendedReview: string[];
  };
}

export interface UnitProgressResponse {
  unit: {
    id: string;
    title: string;
    unitNumber: number;
  };
  statistics: {
    totalStudents: number;
    studentsStarted: number;
    studentsCompleted: number;
    averageProgress: number;
    averageScore: number;
  };
  studentProgress: Array<{
    studentId: string;
    studentName: string;
    status: UnitProgressStatus;
    percentComplete: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    assignmentsScore: number;
    timeSpentMinutes: number;
    strengths: string[];
    struggles: string[];
  }>;
}

// ============================================================================
// UI-SPECIFIC TYPES
// ============================================================================

export interface ScheduleViewMode {
  type: 'timeline' | 'calendar' | 'cards';
  timeScale?: 'weekly' | 'monthly' | 'unit';
}

export interface UnitCardData extends CurriculumUnit {
  isCurrentUnit?: boolean;
  isPastDue?: boolean;
  daysUntilStart?: number;
  daysUntilEnd?: number;
  progressPercentage?: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'unit' | 'milestone' | 'break';
  color: string;
  data?: any;
}

export interface DragDropItem {
  id: string;
  index: number;
  data: CurriculumUnit;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: AIRefinementResponse['suggestedChanges'];
}

export interface ScheduleWizardStep {
  id: number;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isValid: boolean;
  isOptional: boolean;
}

export interface ScheduleWizardState {
  currentStep: number;
  classId?: string;
  curriculumMaterialId?: string;
  schoolYearStart?: string;
  schoolYearEnd?: string;
  title: string;
  description: string;
  meetingPattern?: string;
  aiGenerated: boolean;
  aiPreferences?: GenerateScheduleFromAIRequest['preferences'];
  scheduleId?: string;
  units: CurriculumUnit[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DifficultyConfig {
  level: DifficultyLevel;
  label: string;
  color: string;
  description: string;
}

export interface UnitTypeConfig {
  type: UnitType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export interface ProgressStatusConfig {
  status: UnitProgressStatus;
  label: string;
  color: string;
  icon: string;
  description: string;
}
