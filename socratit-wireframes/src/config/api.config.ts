// ============================================================================
// API CONFIGURATION
// Configure API endpoints and base URLs for backend integration
// ============================================================================

// Base API URL - Connected to backend!
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/register',  // Backend uses /register not /signup
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // Users
  USERS: '/users',
  USER_PROFILE: '/users/me',  // Backend uses /users/me
  CHANGE_PASSWORD: '/users/change-password',

  // Classes
  CLASSES: '/classes',
  CLASS_BY_ID: (id: string) => `/classes/${id}`,
  CLASS_STUDENTS: (id: string) => `/classes/${id}/students`,
  CLASS_ASSIGNMENTS: (id: string) => `/classes/${id}/assignments`,
  CLASS_ANALYTICS: (id: string) => `/classes/${id}/analytics`,

  // Assignments
  ASSIGNMENTS: '/assignments',
  ASSIGNMENT_BY_ID: (id: string) => `/assignments/${id}`,
  ASSIGNMENT_SUBMISSIONS: (id: string) => `/assignments/${id}/submissions`,

  // Submissions
  SUBMISSIONS: '/submissions',
  SUBMISSION_BY_ID: (id: string) => `/submissions/${id}`,

  // Grades
  GRADES: '/grades',
  STUDENT_GRADES: (studentId: string) => `/grades/student/${studentId}`,

  // Messages
  MESSAGES: '/messages',
  CONVERSATIONS: '/messages/conversations',

  // AI Teaching Assistant
  AI_CHAT: '/ai/chat',
  AI_CONVERSATION: (id: string) => `/ai/conversations/${id}`,

  // Admin
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_STUDENTS: '/admin/students',
};

// HTTP Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000; // 30 seconds - default for most requests
export const AI_REQUEST_TIMEOUT = 120000; // 120 seconds (2 minutes) - for AI generation operations

// Mock mode - NOW USING REAL BACKEND!
export const MOCK_MODE = false;
