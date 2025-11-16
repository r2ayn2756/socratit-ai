-- ============================================================================
-- RESOLVE FAILED MIGRATION
-- This migration marks the failed migration as rolled back and completes
-- any partial changes that may have succeeded before the failure
-- ============================================================================

-- Mark the failed migration as rolled back in the _prisma_migrations table
-- This allows new migrations to run
UPDATE "_prisma_migrations"
SET
    finished_at = NOW(),
    rolled_back_at = NOW()
WHERE
    migration_name = '20251116151230_update_assignment_system'
    AND rolled_back_at IS NULL;

-- ============================================================================
-- IDEMPOTENT FIXES: Only apply if they haven't been applied yet
-- These handle partial migration success scenarios
-- ============================================================================

-- Check if AssignmentType_new enum exists and clean it up if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssignmentType_new') THEN
        -- If the new enum was created but migration failed, we need to clean it up
        -- First, ensure the assignments table is using the old enum
        ALTER TABLE "assignments"
        ALTER COLUMN type TYPE TEXT USING (type::TEXT);

        -- Drop the new enum
        DROP TYPE IF EXISTS "AssignmentType_new";

        -- Recreate the original enum if it was dropped
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssignmentType') THEN
            CREATE TYPE "AssignmentType" AS ENUM ('PRACTICE', 'QUIZ', 'TEST', 'HOMEWORK', 'CHALLENGE');
        END IF;

        -- Set the column back to the original enum
        ALTER TABLE "assignments"
        ALTER COLUMN type TYPE "AssignmentType" USING (type::text::"AssignmentType");
    END IF;
END $$;

-- Add curriculum_sub_unit_id column to questions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'curriculum_sub_unit_id'
    ) THEN
        ALTER TABLE "questions" ADD COLUMN "curriculum_sub_unit_id" TEXT;
        CREATE INDEX "questions_curriculum_sub_unit_id_idx" ON "questions"("curriculum_sub_unit_id");

        -- Add foreign key only if curriculum_sub_units table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curriculum_sub_units') THEN
            ALTER TABLE "questions"
            ADD CONSTRAINT "questions_curriculum_sub_unit_id_fkey"
            FOREIGN KEY ("curriculum_sub_unit_id")
            REFERENCES "curriculum_sub_units"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Create rubrics table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rubrics') THEN
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

        CREATE INDEX "rubrics_teacher_id_idx" ON "rubrics"("teacher_id");
        CREATE INDEX "rubrics_school_id_idx" ON "rubrics"("school_id");
        CREATE INDEX "rubrics_is_template_idx" ON "rubrics"("is_template");
        CREATE INDEX "rubrics_subject_idx" ON "rubrics"("subject");

        ALTER TABLE "rubrics"
        ADD CONSTRAINT "rubrics_teacher_id_fkey"
        FOREIGN KEY ("teacher_id")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Create assignment_rubrics table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignment_rubrics') THEN
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

        CREATE INDEX "assignment_rubrics_assignment_id_idx" ON "assignment_rubrics"("assignment_id");
        CREATE INDEX "assignment_rubrics_rubric_id_idx" ON "assignment_rubrics"("rubric_id");
        CREATE INDEX "assignment_rubrics_school_id_idx" ON "assignment_rubrics"("school_id");
        CREATE UNIQUE INDEX "assignment_rubrics_assignment_id_rubric_id_key" ON "assignment_rubrics"("assignment_id", "rubric_id");

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
    END IF;
END $$;

-- Create assignment_attempt_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignment_attempt_logs') THEN
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

        CREATE INDEX "assignment_attempt_logs_submission_id_idx" ON "assignment_attempt_logs"("submission_id");
        CREATE INDEX "assignment_attempt_logs_student_id_idx" ON "assignment_attempt_logs"("student_id");
        CREATE INDEX "assignment_attempt_logs_assignment_id_idx" ON "assignment_attempt_logs"("assignment_id");
        CREATE INDEX "assignment_attempt_logs_school_id_idx" ON "assignment_attempt_logs"("school_id");
        CREATE INDEX "assignment_attempt_logs_event_type_idx" ON "assignment_attempt_logs"("event_type");
        CREATE INDEX "assignment_attempt_logs_is_suspicious_idx" ON "assignment_attempt_logs"("is_suspicious");
        CREATE INDEX "assignment_attempt_logs_created_at_idx" ON "assignment_attempt_logs"("created_at");

        ALTER TABLE "assignment_attempt_logs"
        ADD CONSTRAINT "assignment_attempt_logs_submission_id_fkey"
        FOREIGN KEY ("submission_id")
        REFERENCES "submissions"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;
