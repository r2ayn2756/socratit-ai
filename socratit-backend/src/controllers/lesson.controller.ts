// ============================================================================
// LESSON CONTROLLER
// Handles HTTP requests for class lesson management
// ============================================================================

import { Request, Response } from 'express';
import * as lessonService from '../services/lesson.service';
import { AuthRequest } from '../types';

// ============================================================================
// LESSON ENDPOINTS
// ============================================================================

/**
 * @route   POST /api/v1/classes/:classId/lessons
 * @desc    Create a new lesson with audio recording
 * @access  Teacher only
 */
export async function createLesson(req: AuthRequest, res: Response): Promise<void> {
  const { classId } = req.params;
  const { title, lessonDate, durationSeconds } = req.body;
  const teacherId = req.user!.id;

  // Validate that audio file was uploaded
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'Audio file is required',
    });
    return;
  }

  try {
    const lesson = await lessonService.createLesson({
      classId,
      teacherId,
      title,
      lessonDate: new Date(lessonDate),
      audioBuffer: req.file.buffer,
      durationSeconds: durationSeconds ? parseInt(durationSeconds) : undefined,
    });

    res.status(201).json({
      success: true,
      data: lesson,
      message: 'Lesson notes generated successfully',
    });
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create lesson',
    });
  }
}

/**
 * @route   GET /api/v1/classes/:classId/lessons
 * @desc    Get all lessons for a class
 * @access  Teacher (owns class) or Student (enrolled)
 */
export async function getClassLessons(req: AuthRequest, res: Response): Promise<void> {
  const { classId } = req.params;
  const { limit, offset } = req.query;

  try {
    const lessons = await lessonService.getClassLessons(classId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: lessons,
    });
  } catch (error: any) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons',
    });
  }
}

/**
 * @route   GET /api/v1/classes/:classId/lessons/context
 * @desc    Get aggregated context from all lessons (for teachers)
 * @access  Teacher only
 */
export async function getClassLessonContext(req: AuthRequest, res: Response): Promise<void> {
  const { classId } = req.params;

  try {
    const context = await lessonService.getClassLessonContext(classId);

    res.status(200).json({
      success: true,
      data: context,
    });
  } catch (error: any) {
    console.error('Error fetching lesson context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson context',
    });
  }
}

/**
 * @route   GET /api/v1/lessons/:lessonId
 * @desc    Get a single lesson by ID
 * @access  Teacher (owns class) or Student (enrolled)
 */
export async function getLessonById(req: AuthRequest, res: Response): Promise<void> {
  const { lessonId } = req.params;

  try {
    const lesson = await lessonService.getLessonById(lessonId);

    if (!lesson) {
      res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: lesson,
    });
  } catch (error: any) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson',
    });
  }
}

/**
 * @route   PATCH /api/v1/lessons/:lessonId
 * @desc    Update a lesson
 * @access  Teacher (owns lesson)
 */
export async function updateLesson(req: AuthRequest, res: Response): Promise<void> {
  const { lessonId } = req.params;
  const { title, lessonDate, teacherNotes } = req.body;
  const teacherId = req.user!.id;

  try {
    const lesson = await lessonService.updateLesson(lessonId, teacherId, {
      title,
      lessonDate: lessonDate ? new Date(lessonDate) : undefined,
      teacherNotes,
    });

    res.status(200).json({
      success: true,
      data: lesson,
      message: 'Lesson updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating lesson:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update lesson',
    });
  }
}

/**
 * @route   DELETE /api/v1/lessons/:lessonId
 * @desc    Delete a lesson
 * @access  Teacher (owns lesson)
 */
export async function deleteLesson(req: AuthRequest, res: Response): Promise<void> {
  const { lessonId } = req.params;
  const teacherId = req.user!.id;

  try {
    await lessonService.deleteLesson(lessonId, teacherId);

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting lesson:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete lesson',
    });
  }
}
