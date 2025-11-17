// ============================================================================
// ASSIGNMENT SERVICE
// API service for assignment and submission operations
// ============================================================================

import { apiService } from './api.service';

// ============================================================================
// TYPES
// ============================================================================

export interface Assignment {
  id: string;
  classId: string;
  schoolId: string;
  createdBy: string;
  title: string;
  description?: string;
  instructions?: string;
  type: 'PRACTICE' | 'TEST' | 'ESSAY' | 'INTERACTIVE_MATH';
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  totalPoints: number;
  passingScore?: number;
  publishedAt?: string;
  dueDate?: string;
  closeDate?: string;
  allowLateSubmission: boolean;
  showCorrectAnswers: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimit?: number;
  maxAttempts: number;
  aiGenerated: boolean;
  aiPrompt?: string;
  curriculumSource?: string;
  essayConfig?: EssayConfig;
  // Interactive Math settings
  enableGraphingCalculator?: boolean;
  enableBasicCalculator?: boolean;
  enableStepByStepHints?: boolean;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    subject?: string;
    color: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  questions?: Question[];
  _count?: {
    questions: number;
    submissions: number;
  };
  studentSubmission?: StudentSubmission;
}

export interface EssayConfig {
  minWords?: number;
  maxWords?: number;
  rubric?: RubricCriterion[];
  showRubricToStudent: boolean;
  allowAIAssistant: boolean;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  order: number;
  proficiencyLevels?: ProficiencyLevel[];
}

export interface ProficiencyLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

export interface Question {
  id: string;
  assignmentId: string;
  type: 'MULTIPLE_CHOICE' | 'FREE_RESPONSE' | 'MATH_EXPRESSION';
  questionText: string;
  questionOrder: number;
  points: number;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: 'A' | 'B' | 'C' | 'D';
  correctAnswer?: string;
  rubric?: string;
  explanation?: string;
  concept?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  // Math-specific fields
  latexExpression?: string;
  hints?: string[];
  imageUrl?: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  attemptNumber: number;
  totalScore?: number;
  percentage?: number;
  earnedPoints?: number;
  possiblePoints?: number;
  startedAt?: string;
  submittedAt?: string;
  gradedAt?: string;
  timeSpent?: number;
  isLate: boolean;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  submissionId: string;
  questionId: string;
  answerText?: string;
  selectedOption?: 'A' | 'B' | 'C' | 'D';
  isCorrect?: boolean;
  pointsEarned?: number;
  pointsPossible?: number;
  aiGraded: boolean;
  aiFeedback?: string;
  aiScore?: number;
  aiConfidence?: number;
  manuallyGraded: boolean;
  teacherFeedback?: string;
  teacherOverride: boolean;
  answeredAt?: string;
  gradedAt?: string;
  question?: Question;
}

export interface CreateAssignmentDTO {
  classId: string;
  title: string;
  description?: string;
  instructions?: string;
  type: 'PRACTICE' | 'TEST' | 'ESSAY' | 'INTERACTIVE_MATH';
  totalPoints?: number;
  passingScore?: number;
  dueDate?: string;
  closeDate?: string;
  allowLateSubmission?: boolean;
  showCorrectAnswers?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  timeLimit?: number;
  maxAttempts?: number;
  essayConfig?: EssayConfig;
  // Interactive Math settings
  enableGraphingCalculator?: boolean;
  enableBasicCalculator?: boolean;
  enableStepByStepHints?: boolean;
  questions?: Omit<Question, 'id' | 'assignmentId' | 'createdAt' | 'updatedAt' | 'aiGenerated'>[];
}

export interface GenerateQuizDTO {
  classId: string;
  curriculumText: string;
  assignmentType?: 'PRACTICE' | 'TEST' | 'INTERACTIVE_MATH';
  numQuestions?: number;
  questionTypes?: Array<'MULTIPLE_CHOICE' | 'FREE_RESPONSE' | 'MATH_EXPRESSION'>;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  subject?: string;
  gradeLevel?: string;
}

export interface UpdateAssignmentDTO {
  title?: string;
  description?: string;
  instructions?: string;
  type?: 'PRACTICE' | 'TEST' | 'ESSAY' | 'INTERACTIVE_MATH';
  totalPoints?: number;
  passingScore?: number;
  dueDate?: string;
  closeDate?: string;
  allowLateSubmission?: boolean;
  showCorrectAnswers?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  timeLimit?: number;
  maxAttempts?: number;
  essayConfig?: EssayConfig;
  // Interactive Math settings
  enableGraphingCalculator?: boolean;
  enableBasicCalculator?: boolean;
  enableStepByStepHints?: boolean;
}

export interface PublishAssignmentDTO {
  publishNow?: boolean;
  publishAt?: string;
}

export interface SubmitAnswerDTO {
  questionId: string;
  answerText?: string;
  selectedOption?: 'A' | 'B' | 'C' | 'D';
}

export interface OverrideGradeDTO {
  pointsEarned: number;
  teacherFeedback?: string;
}

export interface LockdownViolationDTO {
  assignmentId: string;
  submissionId?: string;
  violationType: 'TAB_SWITCH' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT';
  timestamp: string;
  message: string;
}

export interface QuestionConceptMappingDTO {
  questionId: string;
  conceptId?: string;
  conceptName?: string;
  subtopicName?: string;
}

// ============================================================================
// ASSIGNMENT SERVICE
// ============================================================================

class AssignmentService {
  // ========================================
  // ASSIGNMENT CRUD
  // ========================================

  async createAssignment(data: CreateAssignmentDTO): Promise<Assignment> {
    const response = await apiService.post<{ success: boolean; data: Assignment }>('/assignments', data);
    return response.data.data;
  }

  async generateQuiz(data: GenerateQuizDTO): Promise<Assignment> {
    const response = await apiService.post<{ success: boolean; data: Assignment }>(
      '/assignments/generate',
      data,
      { timeout: 180000 } // 3 minutes for AI quiz generation
    );
    return response.data.data;
  }

  async generateAssignmentFromLesson(data: {
    lessonId: string;
    numQuestions?: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    assignmentType?: 'PRACTICE' | 'TEST' | 'INTERACTIVE_MATH';
  }): Promise<Assignment> {
    const response = await apiService.post<{ success: boolean; data: Assignment }>(
      '/assignments/generate-from-lesson',
      data,
      { timeout: 180000 } // 3 minutes for AI assignment generation from lesson transcript
    );
    return response.data.data;
  }

  async getAssignments(params?: {
    classId?: string;
    status?: string;
    type?: string;
    includeQuestions?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: Assignment[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append('classId', params.classId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.includeQuestions) queryParams.append('includeQuestions', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiService.get<{ success: boolean; data: Assignment[]; pagination: any }>(
      `/assignments?${queryParams.toString()}`
    );
    return { data: response.data.data, pagination: response.data.pagination };
  }

  async getAssignment(assignmentId: string): Promise<Assignment> {
    const response = await apiService.get<{ success: boolean; data: Assignment }>(`/assignments/${assignmentId}`);
    return response.data.data;
  }

  async updateAssignment(assignmentId: string, data: UpdateAssignmentDTO): Promise<Assignment> {
    const response = await apiService.patch<{ success: boolean; data: Assignment }>(`/assignments/${assignmentId}`, data);
    return response.data.data;
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    await apiService.delete(`/assignments/${assignmentId}`);
  }

  async publishAssignment(assignmentId: string, data: PublishAssignmentDTO): Promise<Assignment> {
    const response = await apiService.post<{ success: boolean; data: Assignment }>(
      `/assignments/${assignmentId}/publish`,
      data
    );
    return response.data.data;
  }

  // ========================================
  // SUBMISSION OPERATIONS
  // ========================================

  async startAssignment(assignmentId: string): Promise<StudentSubmission> {
    const response = await apiService.post<{ success: boolean; data: StudentSubmission }>('/submissions/start', {
      assignmentId,
    });
    return response.data.data;
  }

  async getSubmissions(params?: {
    assignmentId?: string;
    studentId?: string;
    status?: string;
    includeAnswers?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: StudentSubmission[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.assignmentId) queryParams.append('assignmentId', params.assignmentId);
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.includeAnswers) queryParams.append('includeAnswers', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiService.get<{ success: boolean; data: StudentSubmission[]; pagination: any }>(
      `/submissions?${queryParams.toString()}`
    );
    return { data: response.data.data, pagination: response.data.pagination };
  }

  async getSubmission(submissionId: string): Promise<StudentSubmission> {
    const response = await apiService.get<{ success: boolean; data: StudentSubmission }>(`/submissions/${submissionId}`);
    return response.data.data;
  }

  async submitAnswer(submissionId: string, data: SubmitAnswerDTO): Promise<Answer> {
    const response = await apiService.post<{ success: boolean; data: Answer }>(
      `/submissions/${submissionId}/answers`,
      data
    );
    return response.data.data;
  }

  async submitAssignment(submissionId: string): Promise<StudentSubmission> {
    const response = await apiService.post<{ success: boolean; data: StudentSubmission }>(
      `/submissions/${submissionId}/submit`,
      {}
    );
    return response.data.data;
  }

  async overrideGrade(
    submissionId: string,
    answerId: string,
    data: OverrideGradeDTO
  ): Promise<Answer> {
    const response = await apiService.patch<{ success: boolean; data: Answer }>(
      `/submissions/${submissionId}/answers/${answerId}/grade`,
      data
    );
    return response.data.data;
  }

  // ========================================
  // TEST LOCKDOWN & SECURITY
  // ========================================

  /**
   * Log a lockdown violation for a test assignment
   */
  async logLockdownViolation(data: LockdownViolationDTO): Promise<void> {
    await apiService.post('/assignments/lockdown-violations', data);
  }

  /**
   * Get lockdown violations for a submission (teachers only)
   */
  async getLockdownViolations(submissionId: string): Promise<LockdownViolationDTO[]> {
    const response = await apiService.get<{ success: boolean; data: LockdownViolationDTO[] }>(
      `/submissions/${submissionId}/lockdown-violations`
    );
    return response.data.data;
  }

  // ========================================
  // CONCEPT MAPPING
  // ========================================

  /**
   * Update concept mappings for an assignment's questions
   */
  async updateQuestionConceptMappings(
    assignmentId: string,
    mappings: QuestionConceptMappingDTO[]
  ): Promise<void> {
    await apiService.post(`/assignments/${assignmentId}/concept-mappings`, { mappings });
  }

  /**
   * Get concept mappings for an assignment
   */
  async getQuestionConceptMappings(assignmentId: string): Promise<QuestionConceptMappingDTO[]> {
    const response = await apiService.get<{ success: boolean; data: QuestionConceptMappingDTO[] }>(
      `/assignments/${assignmentId}/concept-mappings`
    );
    return response.data.data;
  }
}

export const assignmentService = new AssignmentService();
