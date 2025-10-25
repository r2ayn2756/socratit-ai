// ============================================================================
// MESSAGE VALIDATION SCHEMAS
// Input validation for messaging endpoints
// ============================================================================

import Joi from 'joi';
import { MessageType } from '@prisma/client';

/**
 * Validation schema for sending a direct message
 */
export const sendDirectMessageSchema = Joi.object({
  recipientId: Joi.string().uuid().required().messages({
    'string.guid': 'Recipient ID must be a valid UUID',
    'any.required': 'Recipient ID is required',
  }),
  content: Joi.string().min(1).max(5000).required().messages({
    'string.min': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 5000 characters',
    'any.required': 'Message content is required',
  }),
  classId: Joi.string().uuid().optional().messages({
    'string.guid': 'Class ID must be a valid UUID',
  }),
});

/**
 * Validation schema for sending a class message
 */
export const sendClassMessageSchema = Joi.object({
  classId: Joi.string().uuid().required().messages({
    'string.guid': 'Class ID must be a valid UUID',
    'any.required': 'Class ID is required',
  }),
  content: Joi.string().min(1).max(5000).required().messages({
    'string.min': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 5000 characters',
    'any.required': 'Message content is required',
  }),
  subject: Joi.string().max(200).optional().messages({
    'string.max': 'Subject cannot exceed 200 characters',
  }),
  messageType: Joi.string()
    .valid(MessageType.CLASS_GROUP, MessageType.ANNOUNCEMENT)
    .required()
    .messages({
      'any.only': 'Message type must be CLASS_GROUP or ANNOUNCEMENT',
      'any.required': 'Message type is required',
    }),
});

/**
 * Validation schema for getting conversation
 */
export const getConversationSchema = Joi.object({
  otherUserId: Joi.string().uuid().required().messages({
    'string.guid': 'User ID must be a valid UUID',
    'any.required': 'User ID is required',
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

/**
 * Validation schema for marking message as read
 */
export const markMessageAsReadSchema = Joi.object({
  messageId: Joi.string().uuid().required().messages({
    'string.guid': 'Message ID must be a valid UUID',
    'any.required': 'Message ID is required',
  }),
});

/**
 * Validation schema for searching messages
 */
export const searchMessagesSchema = Joi.object({
  query: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Search query must be at least 2 characters',
    'string.max': 'Search query cannot exceed 200 characters',
    'any.required': 'Search query is required',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

/**
 * Validation schema for getting class messages
 */
export const getClassMessagesSchema = Joi.object({
  classId: Joi.string().uuid().required().messages({
    'string.guid': 'Class ID must be a valid UUID',
    'any.required': 'Class ID is required',
  }),
  messageType: Joi.string()
    .valid(MessageType.CLASS_GROUP, MessageType.ANNOUNCEMENT)
    .optional()
    .messages({
      'any.only': 'Message type must be CLASS_GROUP or ANNOUNCEMENT',
    }),
});
