// ============================================================================
// NOTIFICATION VALIDATION SCHEMAS
// Input validation for notification endpoints
// ============================================================================

import Joi from 'joi';

/**
 * Validation schema for getting notifications
 */
export const getNotificationsSchema = Joi.object({
  unreadOnly: Joi.boolean().default(false),
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Offset must be at least 0',
  }),
});

/**
 * Validation schema for marking notification as read
 */
export const markNotificationAsReadSchema = Joi.object({
  notificationId: Joi.string().uuid().required().messages({
    'string.guid': 'Notification ID must be a valid UUID',
    'any.required': 'Notification ID is required',
  }),
});

/**
 * Validation schema for dismissing notification
 */
export const dismissNotificationSchema = Joi.object({
  notificationId: Joi.string().uuid().required().messages({
    'string.guid': 'Notification ID must be a valid UUID',
    'any.required': 'Notification ID is required',
  }),
});
