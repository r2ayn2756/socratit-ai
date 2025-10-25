// ============================================================================
// SOCRATIT.AI - TYPESCRIPT TYPE DEFINITIONS
// Production-ready types for frontend application
// ============================================================================

// USER ROLES
export type UserRole = 'teacher' | 'student' | 'admin' | 'parent';

// USER TYPES
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePhoto?: string;
  school?: string;
  district?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher extends User {
  role: 'teacher';
  subjects: string[];
  gradeLevel?: string;
  bio?: string;
}

export interface Student extends User {
  role: 'student';
  gradeLevel: string;
  studentId?: string;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// CLASS TYPES
export interface Class {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  period?: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  joinCode: string;
  createdAt: string;
  updatedAt: string;
}

// ASSIGNMENT TYPES
export type AssignmentType = 'homework' | 'quiz' | 'test' | 'project' | 'practice';
export type AssignmentStatus = 'draft' | 'published' | 'scheduled';

export interface Assignment {
  id: string;
  title: string;
  type: AssignmentType;
  classId: string;
  className?: string;
  instructions: string;
  dueDate: string;
  totalPoints: number;
  status: AssignmentStatus;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

// QUESTION TYPES
export type QuestionType = 'multiple-choice' | 'short-answer' | 'long-answer' | 'math' | 'file-upload' | 'true-false';

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  points: number;
  order: number;
  imageUrl?: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string | number; // For auto-gradable questions
}

// SUBMISSION TYPES
export type SubmissionStatus = 'not-started' | 'in-progress' | 'submitted' | 'graded';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  answers: Answer[];
  grade?: number;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
}

export interface Answer {
  questionId: string;
  answer: string | number | File;
  earnedPoints?: number;
  feedback?: string;
}

// GRADE TYPES
export interface Grade {
  assignmentId: string;
  assignmentName: string;
  score: number;
  maxPoints: number;
  percentage: number;
  feedback?: string;
  gradedAt: string;
}

// MESSAGE TYPES
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: UserRole;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// ANALYTICS TYPES
export interface ClassAnalytics {
  classId: string;
  averageGrade: number;
  completionRate: number;
  strugglingStudents: string[];
  topicMastery: TopicMastery[];
}

export interface TopicMastery {
  topic: string;
  masteryLevel: number; // 0-100
  studentsMastered: number;
  totalStudents: number;
}

// AI TA TYPES
export interface AIConversation {
  id: string;
  studentId: string;
  assignmentId: string;
  questionId: string;
  messages: AIMessage[];
  escalated: boolean;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: 'student' | 'ai';
  content: string;
  timestamp: string;
}

// API RESPONSE TYPES
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// FORM TYPES
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolCode: string;  // Required - backend needs this
  school?: string;      // Optional - legacy field
  gradeLevel?: string;
}
