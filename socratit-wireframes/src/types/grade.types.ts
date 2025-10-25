// ============================================================================
// GRADE TYPE DEFINITIONS
// TypeScript types for Grading System (Batch 4)
// ============================================================================

export type LetterGrade =
  | 'A_PLUS'
  | 'A'
  | 'A_MINUS'
  | 'B_PLUS'
  | 'B'
  | 'B_MINUS'
  | 'C_PLUS'
  | 'C'
  | 'C_MINUS'
  | 'D_PLUS'
  | 'D'
  | 'D_MINUS'
  | 'F';

export type GradeType = 'assignment' | 'category' | 'overall';

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;
  assignmentId?: string;
  gradeType: GradeType;
  categoryName?: string;
  pointsEarned: number;
  pointsPossible: number;
  percentage: number;
  letterGrade?: LetterGrade;
  weightedScore?: number;
  extraCredit: number;
  latePenalty: number;
  curve: number;
  isDropped: boolean;
  gradeDate: string;
  teacherComments?: string;
  createdAt: string;
  updatedAt: string;
  assignment?: {
    id: string;
    title: string;
    type: string;
    dueDate?: string;
  };
  class?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface GradeCategory {
  id: string;
  classId: string;
  schoolId: string;
  name: string;
  weight: number;
  dropLowest: number;
  latePenaltyPerDay?: number;
  maxLatePenalty?: number;
  allowExtraCredit: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryGrade {
  categoryName: string;
  weight: number;
  scores: number[];
  dropLowest: number;
  averagePercentage: number;
  weightedScore: number;
}

export interface GradeCalculationResult {
  overallPercentage: number;
  letterGrade: LetterGrade;
  categoryGrades: CategoryGrade[];
  totalPointsEarned: number;
  totalPointsPossible: number;
}

export interface StudentClassGrades {
  grades: Grade[];
  current: GradeCalculationResult;
}

export interface GradeDistribution {
  A_PLUS: number;
  A: number;
  A_MINUS: number;
  B_PLUS: number;
  B: number;
  B_MINUS: number;
  C_PLUS: number;
  C: number;
  C_MINUS: number;
  D_PLUS: number;
  D: number;
  D_MINUS: number;
  F: number;
}

export interface ClassGrades {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  overallGrade?: Grade;
  categoryGrades: Grade[];
}

// Helper function to format letter grade for display
export function formatLetterGrade(grade: LetterGrade): string {
  return grade.replace('_PLUS', '+').replace('_MINUS', '-');
}

// Helper function to get color for letter grade
export function getGradeColor(grade: LetterGrade): string {
  if (grade.startsWith('A')) return 'green';
  if (grade.startsWith('B')) return 'blue';
  if (grade.startsWith('C')) return 'yellow';
  if (grade.startsWith('D')) return 'orange';
  return 'red'; // F
}
