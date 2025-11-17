// ============================================================================
// ASSIGNMENT VALIDATORS
// Joi validation schemas for assignment-related endpoints
// ============================================================================

import Joi from 'joi';

// ============================================================================
// QUESTION SCHEMAS
// ============================================================================

const multipleChoiceQuestionSchema = Joi.object({
  type: Joi.string().valid('MULTIPLE_CHOICE').required(),
  questionText: Joi.string().min(1).max(2000).required(),
  questionOrder: Joi.number().integer().min(1).required(),
  points: Joi.number().integer().min(1).max(100).default(10),
  optionA: Joi.string().min(1).max(500).required(),
  optionB: Joi.string().min(1).max(500).required(),
  optionC: Joi.string().min(1).max(500).required(),
  optionD: Joi.string().min(1).max(500).required(),
  correctOption: Joi.string().valid('A', 'B', 'C', 'D').required(),
  explanation: Joi.string().max(1000).allow(null, ''),
  concept: Joi.string().max(100).allow(null, ''),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').allow(null),
});

const freeResponseQuestionSchema = Joi.object({
  type: Joi.string().valid('FREE_RESPONSE').required(),
  questionText: Joi.string().min(1).max(2000).required(),
  questionOrder: Joi.number().integer().min(1).required(),
  points: Joi.number().integer().min(1).max(100).default(10),
  correctAnswer: Joi.string().min(1).max(2000).required(),
  rubric: Joi.string().max(2000).allow(null, ''),
  explanation: Joi.string().max(1000).allow(null, ''),
  concept: Joi.string().max(100).allow(null, ''),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').allow(null),
});

const questionSchema = Joi.alternatives().try(
  multipleChoiceQuestionSchema,
  freeResponseQuestionSchema
);

// ============================================================================
// ASSIGNMENT VALIDATORS
// ============================================================================

export const createAssignmentValidator = Joi.object({
  classId: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(null, ''),
  instructions: Joi.string().max(2000).allow(null, ''),
  type: Joi.string()
    .valid('PRACTICE', 'TEST', 'ESSAY', 'INTERACTIVE_MATH')
    .required(),
  totalPoints: Joi.number().integer().min(1).max(1000).default(100),
  passingScore: Joi.number().integer().min(0).max(1000).allow(null),
  dueDate: Joi.date().iso().allow(null),
  closeDate: Joi.date().iso().allow(null),
  allowLateSubmission: Joi.boolean().default(false),
  showCorrectAnswers: Joi.boolean().default(true),
  shuffleQuestions: Joi.boolean().default(false),
  shuffleOptions: Joi.boolean().default(false),
  timeLimit: Joi.number().integer().min(1).max(600).allow(null), // Max 10 hours
  maxAttempts: Joi.number().integer().min(1).max(10).default(1),
  questions: Joi.array().items(questionSchema).min(1).max(100).allow(null),
});

export const updateAssignmentValidator = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow(null, ''),
  instructions: Joi.string().max(2000).allow(null, ''),
  type: Joi.string().valid('PRACTICE', 'TEST', 'ESSAY', 'INTERACTIVE_MATH'),
  totalPoints: Joi.number().integer().min(1).max(1000),
  passingScore: Joi.number().integer().min(0).max(1000).allow(null),
  dueDate: Joi.date().iso().allow(null),
  closeDate: Joi.date().iso().allow(null),
  allowLateSubmission: Joi.boolean(),
  showCorrectAnswers: Joi.boolean(),
  shuffleQuestions: Joi.boolean(),
  shuffleOptions: Joi.boolean(),
  timeLimit: Joi.number().integer().min(1).max(600).allow(null),
  maxAttempts: Joi.number().integer().min(1).max(10),
}).min(1); // At least one field must be updated

export const publishAssignmentValidator = Joi.object({
  publishNow: Joi.boolean().default(true),
  publishAt: Joi.date().iso().allow(null),
});

export const generateQuizValidator = Joi.object({
  classId: Joi.string().uuid().required(),
  curriculumText: Joi.string().min(50).max(10000).required(),
  assignmentType: Joi.string()
    .valid('PRACTICE', 'TEST', 'ESSAY', 'INTERACTIVE_MATH')
    .default('PRACTICE'),
  numQuestions: Joi.number().integer().min(1).max(50).default(10),
  questionTypes: Joi.array()
    .items(Joi.string().valid('MULTIPLE_CHOICE', 'FREE_RESPONSE'))
    .min(1)
    .default(['MULTIPLE_CHOICE', 'FREE_RESPONSE']),
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard', 'mixed')
    .default('mixed'),
  subject: Joi.string().max(100).allow(null, ''),
  gradeLevel: Joi.string().max(50).allow(null, ''),
});

// ============================================================================
// QUESTION VALIDATORS
// ============================================================================

export const addQuestionValidator = questionSchema;

export const updateQuestionValidator = Joi.object({
  questionText: Joi.string().min(1).max(2000),
  questionOrder: Joi.number().integer().min(1),
  points: Joi.number().integer().min(1).max(100),
  optionA: Joi.string().min(1).max(500),
  optionB: Joi.string().min(1).max(500),
  optionC: Joi.string().min(1).max(500),
  optionD: Joi.string().min(1).max(500),
  correctOption: Joi.string().valid('A', 'B', 'C', 'D'),
  correctAnswer: Joi.string().min(1).max(2000),
  rubric: Joi.string().max(2000).allow(null, ''),
  explanation: Joi.string().max(1000).allow(null, ''),
  concept: Joi.string().max(100).allow(null, ''),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').allow(null),
}).min(1);

// ============================================================================
// SUBMISSION VALIDATORS
// ============================================================================

export const startAssignmentValidator = Joi.object({
  assignmentId: Joi.string().uuid().required(),
});

export const submitAnswerValidator = Joi.object({
  questionId: Joi.string().uuid().required(),
  answerText: Joi.string().max(5000).allow(null, ''),
  selectedOption: Joi.string().valid('A', 'B', 'C', 'D').allow(null),
}).or('answerText', 'selectedOption'); // At least one must be present

export const submitAssignmentValidator = Joi.object({
  // No body needed - submission ID from params
});

export const bulkSubmitAnswersValidator = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().uuid().required(),
        answerText: Joi.string().max(5000).allow(null, ''),
        selectedOption: Joi.string().valid('A', 'B', 'C', 'D').allow(null),
      }).or('answerText', 'selectedOption')
    )
    .min(1)
    .max(100)
    .required(),
});

// ============================================================================
// GRADING VALIDATORS
// ============================================================================

export const overrideGradeValidator = Joi.object({
  pointsEarned: Joi.number().min(0).required(),
  teacherFeedback: Joi.string().max(2000).allow(null, ''),
});

export const addTeacherFeedbackValidator = Joi.object({
  teacherFeedback: Joi.string().min(1).max(2000).required(),
  teacherNotes: Joi.string().max(2000).allow(null, ''),
});

// ============================================================================
// QUERY PARAMETER VALIDATORS
// ============================================================================

export const getAssignmentsQueryValidator = Joi.object({
  classId: Joi.string().uuid(),
  status: Joi.string().valid('DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED', 'ARCHIVED'),
  type: Joi.string().valid('PRACTICE', 'TEST', 'ESSAY', 'INTERACTIVE_MATH'),
  includeQuestions: Joi.boolean().default(false),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string().valid('createdAt', 'dueDate', 'title').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const getSubmissionsQueryValidator = Joi.object({
  assignmentId: Joi.string().uuid(),
  studentId: Joi.string().uuid(),
  status: Joi.string().valid('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED'),
  includeAnswers: Joi.boolean().default(false),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});
