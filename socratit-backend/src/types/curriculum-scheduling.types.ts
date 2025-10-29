// ============================================================================
// CURRICULUM SCHEDULING TYPES
// TypeScript types for curriculum scheduling system
// ============================================================================

import { Prisma } from '@prisma/client';

// ============================================================================
// DATABASE MODEL TYPES (from Prisma)
// ============================================================================

export type CurriculumSchedule = Prisma.CurriculumScheduleGetPayload<{}>;
export type CurriculumUnit = Prisma.CurriculumUnitGetPayload<{}>;
export type UnitProgress = Prisma.UnitProgressGetPayload<{}>;
export type CurriculumMilestone = Prisma.CurriculumMilestoneGetPayload<{}>;

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateScheduleRequest {
  classId: string;
  schoolYearStart: string; // ISO date string
  schoolYearEnd: string;   // ISO date string
  meetingPattern?: string; // "Daily", "MWF", "TTh", etc.
  title: string;
  description?: string;
  curriculumMaterialId?: string; // Optional link to uploaded curriculum
}

export interface GenerateScheduleFromAIRequest {
  curriculumMaterialId: string;
  preferences?: {
    targetUnits?: number;        // Preferred number of units (6-12)
    pacingPreference?: 'standard' | 'accelerated' | 'extended';
    includeReviewUnits?: boolean;
    breakDates?: string[];       // ISO date strings to avoid scheduling
  };
}

export interface UpdateScheduleRequest {
  title?: string;
  description?: string;
  schoolYearStart?: string;
  schoolYearEnd?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CreateUnitRequest {
  scheduleId: string;
  title: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  topics: UnitTopic[];
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  unitType?: 'CORE' | 'ENRICHMENT' | 'REVIEW' | 'ASSESSMENT' | 'PROJECT' | 'OPTIONAL';
  isOptional?: boolean;
}

export interface UpdateUnitRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  topics?: UnitTopic[];
  difficultyLevel?: 1 | 2 | 3 | 4 | 5;
  unitType?: 'CORE' | 'ENRICHMENT' | 'REVIEW' | 'ASSESSMENT' | 'PROJECT' | 'OPTIONAL';
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'POSTPONED';
  teacherModified?: boolean;
}

export interface ReorderUnitsRequest {
  scheduleId: string;
  unitOrders: Array<{
    unitId: string;
    orderIndex: number;
    startDate?: string; // Optional: update dates during reorder
    endDate?: string;
  }>;
}

export interface RefineScheduleWithAIRequest {
  message: string; // Natural language request
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
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
  status: string;
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
  status: string;
  difficultyLevel: number;
  unitType: string;
  topics: UnitTopic[];
  learningObjectives: string[];
  concepts: string[];
  percentComplete: number;
  assignments?: any[]; // Optional: include assignments
  progress?: {
    studentsStarted: number;
    studentsCompleted: number;
    averageProgress: number;
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
    status: string;
    percentComplete: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    assignmentsScore: number;
    timeSpentMinutes: number;
    strengths: string[];
    struggles: string[];
  }>;
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
    status: string;
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

export interface AIScheduleResponse {
  scheduleId: string;
  units: Array<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    estimatedWeeks: number;
    difficultyLevel: number;
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
  response: string; // AI's natural language response
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
    type: 'PACING' | 'DIFFICULTY' | 'SEQUENCING' | 'ASSESSMENT' | 'REVIEW';
    title: string;
    description: string;
    affectedUnits: string[];
    suggestedAction: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface SuggestedAssignmentsResponse {
  suggestions: Array<{
    type: 'QUIZ' | 'HOMEWORK' | 'TEST' | 'PROJECT';
    title: string;
    description: string;
    suggestedTiming: 'beginning' | 'middle' | 'end';
    suggestedDate: string;
    topicsCovered: string[];
    estimatedQuestions: number;
  }>;
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface UnitTopic {
  name: string;
  subtopics: string[];
  concepts: string[];
  learningObjectives: string[];
}

export interface ScheduleCalculation {
  weeksBetween: (start: Date, end: Date) => number;
  daysBetween: (start: Date, end: Date) => number;
  addWeeks: (date: Date, weeks: number) => Date;
  adjustForWeekend: (date: Date) => Date;
}

export interface ProgressCalculation {
  calculateUnitProgress: (unit: CurriculumUnit, studentId: string) => Promise<number>;
  calculateScheduleProgress: (scheduleId: string) => Promise<number>;
  identifyStrugglingConcepts: (unitId: string, studentId: string) => Promise<string[]>;
  identifyStrengths: (unitId: string, studentId: string) => Promise<string[]>;
}

export interface UnitProgressCalculation {
  unitId: string;
  studentId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW_NEEDED' | 'COMPLETED' | 'MASTERED';
  percentComplete: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  assignmentsScore: number;
  conceptsMastered: number;
  conceptsTotal: number;
  masteryPercentage: number;
  strengths: string[];
  struggles: string[];
  recommendedReview: string[];
}

// ============================================================================
// SERVICE LAYER TYPES
// ============================================================================

export interface CurriculumScheduleService {
  createSchedule(data: CreateScheduleRequest, teacherId: string, schoolId: string): Promise<CurriculumSchedule>;
  generateScheduleFromAI(scheduleId: string, request: GenerateScheduleFromAIRequest): Promise<AIScheduleResponse>;
  getScheduleById(id: string, userId: string): Promise<ScheduleResponse>;
  updateSchedule(id: string, data: UpdateScheduleRequest, userId: string): Promise<CurriculumSchedule>;
  publishSchedule(id: string, userId: string): Promise<CurriculumSchedule>;
  deleteSchedule(id: string, userId: string): Promise<void>;
}

export interface CurriculumUnitService {
  createUnit(data: CreateUnitRequest, teacherId: string, schoolId: string): Promise<CurriculumUnit>;
  updateUnit(id: string, data: UpdateUnitRequest, userId: string): Promise<CurriculumUnit>;
  deleteUnit(id: string, userId: string): Promise<void>;
  reorderUnits(data: ReorderUnitsRequest, userId: string): Promise<void>;
  getUnitById(id: string, userId: string): Promise<UnitResponse>;
  getUnitProgress(unitId: string, userId: string): Promise<UnitProgressResponse>;
}

export interface UnitProgressService {
  getStudentProgress(studentId: string, classId: string): Promise<StudentUnitProgressResponse>;
  calculateUnitProgress(unitId: string, studentId: string): Promise<void>;
  updateProgress(unitId: string, studentId: string): Promise<void>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ScheduleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type UnitType = 'CORE' | 'ENRICHMENT' | 'REVIEW' | 'ASSESSMENT' | 'PROJECT' | 'OPTIONAL';
export type UnitStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'POSTPONED';
export type UnitProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW_NEEDED' | 'COMPLETED' | 'MASTERED';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ScheduleNotFoundError extends Error {
  constructor(scheduleId: string) {
    super(`Curriculum schedule not found: ${scheduleId}`);
    this.name = 'ScheduleNotFoundError';
  }
}

export class UnitNotFoundError extends Error {
  constructor(unitId: string) {
    super(`Curriculum unit not found: ${unitId}`);
    this.name = 'UnitNotFoundError';
  }
}

export class UnauthorizedScheduleAccessError extends Error {
  constructor() {
    super('You do not have permission to access this curriculum schedule');
    this.name = 'UnauthorizedScheduleAccessError';
  }
}

export class InvalidScheduleDatesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidScheduleDatesError';
  }
}

export class ScheduleGenerationError extends Error {
  constructor(message: string) {
    super(`Failed to generate schedule: ${message}`);
    this.name = 'ScheduleGenerationError';
  }
}
