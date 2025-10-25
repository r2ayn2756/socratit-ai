-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('PRACTICE', 'QUIZ', 'TEST', 'HOMEWORK', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FREE_RESPONSE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CREATE_ASSIGNMENT';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_ASSIGNMENT';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_ASSIGNMENT';
ALTER TYPE "AuditAction" ADD VALUE 'PUBLISH_ASSIGNMENT';
ALTER TYPE "AuditAction" ADD VALUE 'VIEW_ASSIGNMENT';
ALTER TYPE "AuditAction" ADD VALUE 'SUBMIT_ASSIGNMENT';
ALTER TYPE "AuditAction" ADD VALUE 'GRADE_ASSIGNMENT';
ALTER TYPE "AuditAction" ADD VALUE 'AI_GENERATE_QUIZ';
ALTER TYPE "AuditAction" ADD VALUE 'AI_GRADE_RESPONSE';

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "type" "AssignmentType" NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "total_points" INTEGER NOT NULL DEFAULT 100,
    "passing_score" INTEGER,
    "published_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "close_date" TIMESTAMP(3),
    "allow_late_submission" BOOLEAN NOT NULL DEFAULT false,
    "show_correct_answers" BOOLEAN NOT NULL DEFAULT true,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "time_limit" INTEGER,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_prompt" TEXT,
    "curriculum_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_order" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "option_a" TEXT,
    "option_b" TEXT,
    "option_c" TEXT,
    "option_d" TEXT,
    "correct_option" TEXT,
    "correct_answer" TEXT,
    "rubric" TEXT,
    "explanation" TEXT,
    "concept" TEXT,
    "difficulty" TEXT,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "total_score" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "earned_points" DOUBLE PRECISION,
    "possible_points" INTEGER,
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "graded_at" TIMESTAMP(3),
    "graded_by" TEXT,
    "time_spent" INTEGER,
    "teacher_feedback" TEXT,
    "teacher_notes" TEXT,
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT,
    "selected_option" TEXT,
    "is_correct" BOOLEAN,
    "points_earned" DOUBLE PRECISION,
    "points_possible" DOUBLE PRECISION,
    "ai_graded" BOOLEAN NOT NULL DEFAULT false,
    "ai_feedback" TEXT,
    "ai_score" DOUBLE PRECISION,
    "ai_confidence" DOUBLE PRECISION,
    "manually_graded" BOOLEAN NOT NULL DEFAULT false,
    "teacher_feedback" TEXT,
    "teacher_override" BOOLEAN NOT NULL DEFAULT false,
    "answered_at" TIMESTAMP(3),
    "graded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "submission_id" TEXT,
    "question_id" TEXT,
    "school_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignments_class_id_idx" ON "assignments"("class_id");

-- CreateIndex
CREATE INDEX "assignments_school_id_idx" ON "assignments"("school_id");

-- CreateIndex
CREATE INDEX "assignments_created_by_idx" ON "assignments"("created_by");

-- CreateIndex
CREATE INDEX "assignments_status_idx" ON "assignments"("status");

-- CreateIndex
CREATE INDEX "assignments_type_idx" ON "assignments"("type");

-- CreateIndex
CREATE INDEX "assignments_due_date_idx" ON "assignments"("due_date");

-- CreateIndex
CREATE INDEX "assignments_published_at_idx" ON "assignments"("published_at");

-- CreateIndex
CREATE INDEX "questions_assignment_id_idx" ON "questions"("assignment_id");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE INDEX "questions_concept_idx" ON "questions"("concept");

-- CreateIndex
CREATE INDEX "submissions_assignment_id_idx" ON "submissions"("assignment_id");

-- CreateIndex
CREATE INDEX "submissions_student_id_idx" ON "submissions"("student_id");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_submitted_at_idx" ON "submissions"("submitted_at");

-- CreateIndex
CREATE INDEX "submissions_graded_at_idx" ON "submissions"("graded_at");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignment_id_student_id_attempt_number_key" ON "submissions"("assignment_id", "student_id", "attempt_number");

-- CreateIndex
CREATE INDEX "answers_submission_id_idx" ON "answers"("submission_id");

-- CreateIndex
CREATE INDEX "answers_question_id_idx" ON "answers"("question_id");

-- CreateIndex
CREATE INDEX "answers_is_correct_idx" ON "answers"("is_correct");

-- CreateIndex
CREATE UNIQUE INDEX "answers_submission_id_question_id_key" ON "answers"("submission_id", "question_id");

-- CreateIndex
CREATE INDEX "analytics_events_student_id_idx" ON "analytics_events"("student_id");

-- CreateIndex
CREATE INDEX "analytics_events_assignment_id_idx" ON "analytics_events"("assignment_id");

-- CreateIndex
CREATE INDEX "analytics_events_submission_id_idx" ON "analytics_events"("submission_id");

-- CreateIndex
CREATE INDEX "analytics_events_question_id_idx" ON "analytics_events"("question_id");

-- CreateIndex
CREATE INDEX "analytics_events_school_id_idx" ON "analytics_events"("school_id");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
