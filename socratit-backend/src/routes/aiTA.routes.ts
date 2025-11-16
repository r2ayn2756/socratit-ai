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
// STUDENT & TEACHER ROUTES - Conversations & Messaging
// ============================================================================

// Create new conversation (both students and teachers can use AI)
router.post(
  '/conversations',
  authorizeRoles(['STUDENT', 'TEACHER']),
  validateRequest(validators.createConversationSchema),
  aiTAController.createConversation
);

// List conversations (both students and teachers)
router.get(
  '/conversations',
  authorizeRoles(['STUDENT', 'TEACHER']),
  validateRequest(validators.listConversationsSchema, 'query'),
  aiTAController.listConversations
);

// Get specific conversation with messages (both students and teachers)
router.get(
  '/conversations/:id',
  authorizeRoles(['STUDENT', 'TEACHER']),
  aiTAController.getConversation
);

// Send message (non-streaming) (both students and teachers)
router.post(
  '/conversations/:id/messages',
  authorizeRoles(['STUDENT', 'TEACHER']),
  validateRequest(validators.sendMessageSchema),
  aiTAController.sendMessage
);

// Share conversation with teacher (students only)
router.post(
  '/conversations/:id/share',
  authorizeRoles(['STUDENT']),
  aiTAController.shareConversation
);

// End/Close conversation (both students and teachers)
router.post(
  '/conversations/:id/end',
  authorizeRoles(['STUDENT', 'TEACHER']),
  aiTAController.endConversation
);

// Alias: Close conversation (same as end)
router.post(
  '/conversations/:id/close',
  authorizeRoles(['STUDENT', 'TEACHER']),
  aiTAController.endConversation
);

// Rate AI message (both students and teachers)
router.post(
  '/messages/:id/feedback',
  authorizeRoles(['STUDENT', 'TEACHER']),
  validateRequest(validators.rateMessageSchema),
  aiTAController.rateMessage
);

// Delete AI message (both students and teachers)
router.delete(
  '/messages/:id',
  authorizeRoles(['STUDENT', 'TEACHER']),
  aiTAController.deleteMessage
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
