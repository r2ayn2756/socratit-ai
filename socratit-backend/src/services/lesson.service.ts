// ============================================================================
// LESSON SERVICE
// Handles class lesson recording, transcription, and note generation
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { generateLessonNotes } from './ai.service';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES
// ============================================================================

export interface CreateLessonDTO {
  classId: string;
  teacherId: string;
  title: string;
  lessonDate: Date;
  audioBuffer: Buffer;
  durationSeconds?: number;
}

export interface UpdateLessonDTO {
  title?: string;
  lessonDate?: Date;
  teacherNotes?: string;
}

export interface LessonWithContext {
  id: string;
  classId: string;
  schoolId: string;
  teacherId: string;
  title: string;
  lessonDate: Date;
  durationSeconds: number | null;
  summary: string;
  keyConcepts: string[];
  actionItems: string[];
  homework: string | null;
  fullTranscript: string | null;
  teacherNotes: string | null;
  aiModel: string | null;
  processingTime: number | null;
  confidenceScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// LESSON CRUD OPERATIONS
// ============================================================================

/**
 * Create a new lesson with AI-generated notes from audio
 */
export async function createLesson(data: CreateLessonDTO): Promise<LessonWithContext> {
  const startTime = Date.now();

  // 1. Get class information for context
  const classInfo = await prisma.class.findUnique({
    where: { id: data.classId },
    select: {
      schoolId: true,
      name: true,
      subject: true,
      gradeLevel: true,
    },
  });

  if (!classInfo) {
    throw new Error('Class not found');
  }

  // 2. Verify teacher has access to this class
  const teacherAccess = await prisma.classTeacher.findFirst({
    where: {
      classId: data.classId,
      teacherId: data.teacherId,
    },
  });

  if (!teacherAccess) {
    throw new Error('Teacher does not have access to this class');
  }

  // 3. Generate AI notes from audio
  const aiResult = await generateLessonNotes(data.audioBuffer, {
    className: classInfo.name,
    subject: classInfo.subject || 'General',
    gradeLevel: classInfo.gradeLevel || 'Unknown',
    lessonTitle: data.title,
  });

  const processingTime = Date.now() - startTime;

  // 4. Save lesson to database
  const lesson = await prisma.classLesson.create({
    data: {
      classId: data.classId,
      schoolId: classInfo.schoolId,
      teacherId: data.teacherId,
      title: data.title,
      lessonDate: data.lessonDate,
      durationSeconds: data.durationSeconds,
      summary: aiResult.summary,
      keyConcepts: aiResult.keyConcepts,
      actionItems: aiResult.actionItems,
      homework: aiResult.homework,
      fullTranscript: aiResult.fullTranscript,
      aiModel: 'gemini-2.0-flash-exp',
      processingTime,
      confidenceScore: 0.9, // Default confidence
    },
  });

  return lesson as LessonWithContext;
}

/**
 * Get all lessons for a class
 */
export async function getClassLessons(
  classId: string,
  options?: { limit?: number; offset?: number }
): Promise<LessonWithContext[]> {
  const lessons = await prisma.classLesson.findMany({
    where: {
      classId,
      deletedAt: null,
    },
    orderBy: {
      lessonDate: 'desc',
    },
    take: options?.limit,
    skip: options?.offset,
  });

  return lessons as LessonWithContext[];
}

/**
 * Get a single lesson by ID
 */
export async function getLessonById(lessonId: string): Promise<LessonWithContext | null> {
  const lesson = await prisma.classLesson.findUnique({
    where: { id: lessonId, deletedAt: null },
  });

  return lesson as LessonWithContext | null;
}

/**
 * Update a lesson
 */
export async function updateLesson(
  lessonId: string,
  teacherId: string,
  data: UpdateLessonDTO
): Promise<LessonWithContext> {
  // Verify teacher owns this lesson
  const existingLesson = await prisma.classLesson.findUnique({
    where: { id: lessonId },
    select: { teacherId: true },
  });

  if (!existingLesson) {
    throw new Error('Lesson not found');
  }

  if (existingLesson.teacherId !== teacherId) {
    throw new Error('Unauthorized to update this lesson');
  }

  // Update lesson
  const lesson = await prisma.classLesson.update({
    where: { id: lessonId },
    data: {
      title: data.title,
      lessonDate: data.lessonDate,
      teacherNotes: data.teacherNotes,
    },
  });

  return lesson as LessonWithContext;
}

/**
 * Delete a lesson (soft delete)
 */
export async function deleteLesson(lessonId: string, teacherId: string): Promise<void> {
  // Verify teacher owns this lesson
  const existingLesson = await prisma.classLesson.findUnique({
    where: { id: lessonId },
    select: { teacherId: true },
  });

  if (!existingLesson) {
    throw new Error('Lesson not found');
  }

  if (existingLesson.teacherId !== teacherId) {
    throw new Error('Unauthorized to delete this lesson');
  }

  // Soft delete
  await prisma.classLesson.update({
    where: { id: lessonId },
    data: { deletedAt: new Date() },
  });
}

// ============================================================================
// CONTEXT AGGREGATION FOR TEACHERS
// ============================================================================

/**
 * Get aggregated context from all lessons in a class
 * This provides teachers with an overview of all concepts and topics covered
 */
export async function getClassLessonContext(classId: string): Promise<{
  totalLessons: number;
  allKeyConcepts: string[];
  allActionItems: string[];
  recentLessons: Array<{ date: Date; title: string; summary: string }>;
}> {
  const lessons = await prisma.classLesson.findMany({
    where: {
      classId,
      deletedAt: null,
    },
    orderBy: {
      lessonDate: 'desc',
    },
    select: {
      lessonDate: true,
      title: true,
      summary: true,
      keyConcepts: true,
      actionItems: true,
    },
  });

  // Aggregate all key concepts (deduplicated)
  const allConceptsSet = new Set<string>();
  lessons.forEach((lesson) => {
    lesson.keyConcepts.forEach((concept) => allConceptsSet.add(concept));
  });

  // Collect all pending action items
  const allActionItems: string[] = [];
  lessons.forEach((lesson) => {
    allActionItems.push(...lesson.actionItems);
  });

  // Recent lessons (last 5)
  const recentLessons = lessons.slice(0, 5).map((lesson) => ({
    date: lesson.lessonDate,
    title: lesson.title,
    summary: lesson.summary,
  }));

  return {
    totalLessons: lessons.length,
    allKeyConcepts: Array.from(allConceptsSet),
    allActionItems,
    recentLessons,
  };
}
