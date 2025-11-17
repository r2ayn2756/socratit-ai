-- ============================================================================
-- ASSIGNMENT SYSTEM UPDATE MIGRATION
-- ============================================================================
-- 1. Update AssignmentType enum (remove QUIZ, CHALLENGE; add ESSAY, INTERACTIVE_MATH)
-- 2. Add concept mapping between Questions and CurriculumSubUnits
-- 3. Add Rubric system with criteria and templates
-- 4. Add AssignmentAttemptLog for test security tracking
-- ============================================================================

-- ============================================================================
-- STEP 1: Update AssignmentType Enum
-- ============================================================================

-- Alter the enum to remove old values and add new ones
-- Note: This requires a multi-step process to avoid data loss

-- First, create a new enum with the updated values
CREATE TYPE "AssignmentType_new" AS ENUM ('PRACTICE', 'TEST', 'HOMEWORK', 'ESSAY', 'INTERACTIVE_MATH');

-- Update existing data to migrate old types to new types
-- QUIZ -> PRACTICE (closest equivalent)
-- CHALLENGE -> PRACTICE (closest equivalent)
UPDATE "assignments"
SET type = 'PRACTICE'::"AssignmentType"
WHERE type IN ('QUIZ', 'CHALLENGE');

-- Alter the column to use the new enum
ALTER TABLE "assignments"
ALTER COLUMN type TYPE "AssignmentType_new"
USING (type::text::"AssignmentType_new");

-- Drop the old enum and rename the new one
DROP TYPE "AssignmentType";
ALTER TYPE "AssignmentType_new" RENAME TO "AssignmentType";

-- ============================================================================
-- STEP 2: Add Concept Mapping to Questions
-- ============================================================================

-- Add curriculum_sub_unit_id to questions table for concept mastery tracking
ALTER TABLE "questions" ADD COLUMN "curriculum_sub_unit_id" TEXT;

-- Create index for performance
CREATE INDEX "questions_curriculum_sub_unit_id_idx" ON "questions"("curriculum_sub_unit_id");

-- Add foreign key constraint
ALTER TABLE "questions"
ADD CONSTRAINT "questions_curriculum_sub_unit_id_fkey"
FOREIGN KEY ("curriculum_sub_unit_id")
REFERENCES "curriculum_sub_units"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- STEP 3: Create Rubric Models
-- ============================================================================

-- Create Rubric table for reusable grading rubrics
CREATE TABLE "rubrics" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT true,
    "criteria" JSONB NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 100,
    "subject" TEXT,
    "grade_level" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rubrics_pkey" PRIMARY KEY ("id")
);

-- Create indexes for rubrics
CREATE INDEX "rubrics_teacher_id_idx" ON "rubrics"("teacher_id");
CREATE INDEX "rubrics_school_id_idx" ON "rubrics"("school_id");
CREATE INDEX "rubrics_is_template_idx" ON "rubrics"("is_template");
CREATE INDEX "rubrics_subject_idx" ON "rubrics"("subject");

-- Add foreign key for teacher
ALTER TABLE "rubrics"
ADD CONSTRAINT "rubrics_teacher_id_fkey"
FOREIGN KEY ("teacher_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Create AssignmentRubric junction table
CREATE TABLE "assignment_rubrics" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "rubric_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "custom_criteria" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_rubrics_pkey" PRIMARY KEY ("id")
);

-- Create indexes and constraints for assignment_rubrics
CREATE INDEX "assignment_rubrics_assignment_id_idx" ON "assignment_rubrics"("assignment_id");
CREATE INDEX "assignment_rubrics_rubric_id_idx" ON "assignment_rubrics"("rubric_id");
CREATE INDEX "assignment_rubrics_school_id_idx" ON "assignment_rubrics"("school_id");
CREATE UNIQUE INDEX "assignment_rubrics_assignment_id_rubric_id_key" ON "assignment_rubrics"("assignment_id", "rubric_id");

-- Add foreign keys for assignment_rubrics
ALTER TABLE "assignment_rubrics"
ADD CONSTRAINT "assignment_rubrics_assignment_id_fkey"
FOREIGN KEY ("assignment_id")
REFERENCES "assignments"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "assignment_rubrics"
ADD CONSTRAINT "assignment_rubrics_rubric_id_fkey"
FOREIGN KEY ("rubric_id")
REFERENCES "rubrics"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- ============================================================================
-- STEP 4: Create AssignmentAttemptLog for Test Security
-- ============================================================================

-- Create assignment_attempt_logs table for security tracking
CREATE TABLE "assignment_attempt_logs" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "question_id" TEXT,
    "time_on_question" INTEGER,
    "total_time_elapsed" INTEGER,
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
    "severity_level" TEXT NOT NULL DEFAULT 'low',
    "reviewed_by_teacher" BOOLEAN NOT NULL DEFAULT false,
    "teacher_notes" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "screen_resolution" TEXT,
    "is_fullscreen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_attempt_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for assignment_attempt_logs
CREATE INDEX "assignment_attempt_logs_submission_id_idx" ON "assignment_attempt_logs"("submission_id");
CREATE INDEX "assignment_attempt_logs_student_id_idx" ON "assignment_attempt_logs"("student_id");
CREATE INDEX "assignment_attempt_logs_assignment_id_idx" ON "assignment_attempt_logs"("assignment_id");
CREATE INDEX "assignment_attempt_logs_school_id_idx" ON "assignment_attempt_logs"("school_id");
CREATE INDEX "assignment_attempt_logs_event_type_idx" ON "assignment_attempt_logs"("event_type");
CREATE INDEX "assignment_attempt_logs_is_suspicious_idx" ON "assignment_attempt_logs"("is_suspicious");
CREATE INDEX "assignment_attempt_logs_created_at_idx" ON "assignment_attempt_logs"("created_at");

-- Add foreign key for submission
ALTER TABLE "assignment_attempt_logs"
ADD CONSTRAINT "assignment_attempt_logs_submission_id_fkey"
FOREIGN KEY ("submission_id")
REFERENCES "submissions"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
