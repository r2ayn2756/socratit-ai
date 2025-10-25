/**
 * AI TEACHING ASSISTANT VALIDATORS
 * Request validation schemas for AI TA endpoints
 */

import Joi from 'joi';

export const createConversationSchema = Joi.object({
  classId: Joi.string().uuid().optional(),
  assignmentId: Joi.string().uuid().optional(),
  conversationType: Joi.string()
    .valid('GENERAL_HELP', 'ASSIGNMENT_HELP', 'CONCEPT_REVIEW', 'HOMEWORK_HELP', 'EXAM_PREP')
    .optional(),
  title: Joi.string().max(200).optional(),
});

export const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
});

export const rateMessageSchema = Joi.object({
  wasHelpful: Joi.boolean().required(),
  feedbackNote: Joi.string().max(500).optional(),
});

export const listConversationsSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  classId: Joi.string().uuid().optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

export const getInsightsSchema = Joi.object({
  periodStart: Joi.date().iso().optional(),
  periodEnd: Joi.date().iso().optional(),
});

export const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  templateType: Joi.string()
    .valid('general_help', 'concept_explanation', 'hint_generation', 'assignment_help', 'exam_prep', 'problem_solving')
    .required(),
  systemPrompt: Joi.string().min(10).max(5000).required(),
  temperature: Joi.number().min(0).max(2).optional(),
  maxTokens: Joi.number().integer().min(50).max(2000).optional(),
  model: Joi.string().valid('gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo').optional(),
  allowDirectAnswers: Joi.boolean().optional(),
  useExamples: Joi.boolean().optional(),
  useSocraticMethod: Joi.boolean().optional(),
});
