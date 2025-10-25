/**
 * AI TEACHING ASSISTANT ROUTES
 * API endpoints for AI TA features
 */

import { Router } from 'express';
import * as aiTAController from '../controllers/aiTA.controller';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import * as validators from '../validators/aiTA.validator';

const router = Router();

// All AI TA routes require authentication
router.use(authenticate);

// ============================================================================
// STUDENT ROUTES - Conversations & Messaging
// ============================================================================

// Create new conversation
router.post(
  '/conversations',
  authorizeRoles(['STUDENT']),
  validateRequest(validators.createConversationSchema),
  aiTAController.createConversation
);

// List student's conversations
router.get(
  '/conversations',
  authorizeRoles(['STUDENT']),
  validateRequest(validators.listConversationsSchema, 'query'),
  aiTAController.listConversations
);

// Get specific conversation with messages
router.get(
  '/conversations/:id',
  authorizeRoles(['STUDENT']),
  aiTAController.getConversation
);

// Send message (non-streaming)
router.post(
  '/conversations/:id/messages',
  authorizeRoles(['STUDENT']),
  validateRequest(validators.sendMessageSchema),
  aiTAController.sendMessage
);

// Share conversation with teacher
router.post(
  '/conversations/:id/share',
  authorizeRoles(['STUDENT']),
  aiTAController.shareConversation
);

// End conversation
router.post(
  '/conversations/:id/end',
  authorizeRoles(['STUDENT']),
  aiTAController.endConversation
);

// Rate AI message
router.post(
  '/messages/:id/feedback',
  authorizeRoles(['STUDENT']),
  validateRequest(validators.rateMessageSchema),
  aiTAController.rateMessage
);

// ============================================================================
// TEACHER ROUTES - Insights & Analytics
// ============================================================================

// Get class AI insights
router.get(
  '/insights/class/:classId',
  authorizeRoles(['TEACHER']),
  validateRequest(validators.getInsightsSchema, 'query'),
  aiTAController.getClassInsights
);

// Get student AI usage stats
router.get(
  '/insights/student/:studentId',
  authorizeRoles(['TEACHER']),
  aiTAController.getStudentAIUsage
);

// ============================================================================
// TEACHER ROUTES - Prompt Template Management
// ============================================================================

// List templates
router.get(
  '/templates',
  authorizeRoles(['TEACHER']),
  aiTAController.listTemplates
);

// Create custom template
router.post(
  '/templates',
  authorizeRoles(['TEACHER']),
  validateRequest(validators.createTemplateSchema),
  aiTAController.createTemplate
);

// Update template
router.patch(
  '/templates/:id',
  authorizeRoles(['TEACHER']),
  aiTAController.updateTemplate
);

export default router;
