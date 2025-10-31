// ============================================================================
// LESSON TYPES
// TypeScript type definitions for class lesson tracking
// ============================================================================

export interface ClassLesson {
  id: string;
  classId: string;
  schoolId: string;
  teacherId: string;
  title: string;
  lessonDate: string; // ISO date string
  durationSeconds: number | null;
  summary: string;
  keyConcepts: string[];
  actionItems: string[];
  homework: string | null;
  fullTranscript: string | null; // Only available to teachers
  teacherNotes: string | null;
  aiModel: string | null;
  processingTime: number | null;
  confidenceScore: number | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CreateLessonDTO {
  title: string;
  lessonDate: string; // ISO date string
  audioFile: File;
  durationSeconds?: number;
}

export interface UpdateLessonDTO {
  title?: string;
  lessonDate?: string; // ISO date string
  teacherNotes?: string;
}

export interface LessonContext {
  totalLessons: number;
  allKeyConcepts: string[];
  allActionItems: string[];
  recentLessons: Array<{
    date: string;
    title: string;
    summary: string;
  }>;
}
