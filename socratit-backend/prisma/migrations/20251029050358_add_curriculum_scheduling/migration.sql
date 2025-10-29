-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('CORE', 'ENRICHMENT', 'REVIEW', 'ASSESSMENT', 'PROJECT', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "UnitProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'REVIEW_NEEDED', 'COMPLETED', 'MASTERED');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('UNIT_START', 'UNIT_MIDPOINT', 'UNIT_END', 'QUARTER_REVIEW', 'SEMESTER_EXAM', 'YEAR_END_REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "ai_conversations" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '90 days';

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "curriculum_unit_id" TEXT;

-- CreateTable
CREATE TABLE "curriculum_schedules" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "curriculum_material_id" TEXT,
    "teacher_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "school_year_start" TIMESTAMP(3) NOT NULL,
    "school_year_end" TIMESTAMP(3) NOT NULL,
    "total_weeks" INTEGER NOT NULL,
    "total_days" INTEGER NOT NULL,
    "meeting_pattern" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_prompt_used" TEXT,
    "ai_confidence" DOUBLE PRECISION,
    "last_ai_refinement" TIMESTAMP(3),
    "current_unit_id" TEXT,
    "completed_units" INTEGER NOT NULL DEFAULT 0,
    "total_units" INTEGER NOT NULL,
    "percent_complete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "curriculum_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_units" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "unit_number" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "topics" JSONB NOT NULL,
    "learning_objectives" TEXT[],
    "concepts" TEXT[],
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "estimated_weeks" DOUBLE PRECISION NOT NULL,
    "estimated_hours" DOUBLE PRECISION,
    "actual_start_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "difficulty_level" INTEGER NOT NULL,
    "difficulty_reasoning" TEXT,
    "pacing_notes" TEXT,
    "unit_type" "UnitType" NOT NULL DEFAULT 'CORE',
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "prerequisite_units" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "build_upon_topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggested_assessments" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_confidence" DOUBLE PRECISION,
    "teacher_modified" BOOLEAN NOT NULL DEFAULT false,
    "status" "UnitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "percent_complete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "curriculum_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_progress" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "status" "UnitProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "percent_complete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assignments_total" INTEGER NOT NULL DEFAULT 0,
    "assignments_completed" INTEGER NOT NULL DEFAULT 0,
    "assignments_score" DOUBLE PRECISION,
    "concepts_mastered" INTEGER NOT NULL DEFAULT 0,
    "concepts_total" INTEGER NOT NULL DEFAULT 0,
    "mastery_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "time_spent_minutes" INTEGER NOT NULL DEFAULT 0,
    "first_accessed_at" TIMESTAMP(3),
    "last_accessed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "struggles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommended_review" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "engagement_score" DOUBLE PRECISION,
    "participation_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_milestones" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "milestone_type" "MilestoneType" NOT NULL,
    "suggested_date" TIMESTAMP(3) NOT NULL,
    "actual_date" TIMESTAMP(3),
    "recommended_assessment_type" TEXT,
    "topics_covered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PLANNED',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "teacher_modified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_schedules_class_id_idx" ON "curriculum_schedules"("class_id");

-- CreateIndex
CREATE INDEX "curriculum_schedules_teacher_id_idx" ON "curriculum_schedules"("teacher_id");

-- CreateIndex
CREATE INDEX "curriculum_schedules_school_id_idx" ON "curriculum_schedules"("school_id");

-- CreateIndex
CREATE INDEX "curriculum_schedules_status_idx" ON "curriculum_schedules"("status");

-- CreateIndex
CREATE INDEX "curriculum_schedules_school_year_start_idx" ON "curriculum_schedules"("school_year_start");

-- CreateIndex
CREATE INDEX "curriculum_schedules_school_year_end_idx" ON "curriculum_schedules"("school_year_end");

-- CreateIndex
CREATE INDEX "curriculum_units_schedule_id_idx" ON "curriculum_units"("schedule_id");

-- CreateIndex
CREATE INDEX "curriculum_units_school_id_idx" ON "curriculum_units"("school_id");

-- CreateIndex
CREATE INDEX "curriculum_units_status_idx" ON "curriculum_units"("status");

-- CreateIndex
CREATE INDEX "curriculum_units_start_date_idx" ON "curriculum_units"("start_date");

-- CreateIndex
CREATE INDEX "curriculum_units_end_date_idx" ON "curriculum_units"("end_date");

-- CreateIndex
CREATE INDEX "curriculum_units_order_index_idx" ON "curriculum_units"("order_index");

-- CreateIndex
CREATE INDEX "curriculum_units_unit_type_idx" ON "curriculum_units"("unit_type");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_units_schedule_id_unit_number_key" ON "curriculum_units"("schedule_id", "unit_number");

-- CreateIndex
CREATE INDEX "unit_progress_student_id_idx" ON "unit_progress"("student_id");

-- CreateIndex
CREATE INDEX "unit_progress_class_id_idx" ON "unit_progress"("class_id");

-- CreateIndex
CREATE INDEX "unit_progress_school_id_idx" ON "unit_progress"("school_id");

-- CreateIndex
CREATE INDEX "unit_progress_status_idx" ON "unit_progress"("status");

-- CreateIndex
CREATE INDEX "unit_progress_percent_complete_idx" ON "unit_progress"("percent_complete");

-- CreateIndex
CREATE UNIQUE INDEX "unit_progress_unit_id_student_id_key" ON "unit_progress"("unit_id", "student_id");

-- CreateIndex
CREATE INDEX "curriculum_milestones_schedule_id_idx" ON "curriculum_milestones"("schedule_id");

-- CreateIndex
CREATE INDEX "curriculum_milestones_unit_id_idx" ON "curriculum_milestones"("unit_id");

-- CreateIndex
CREATE INDEX "curriculum_milestones_school_id_idx" ON "curriculum_milestones"("school_id");

-- CreateIndex
CREATE INDEX "curriculum_milestones_suggested_date_idx" ON "curriculum_milestones"("suggested_date");

-- CreateIndex
CREATE INDEX "curriculum_milestones_milestone_type_idx" ON "curriculum_milestones"("milestone_type");

-- CreateIndex
CREATE INDEX "curriculum_milestones_status_idx" ON "curriculum_milestones"("status");

-- CreateIndex
CREATE INDEX "assignments_curriculum_unit_id_idx" ON "assignments"("curriculum_unit_id");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_curriculum_unit_id_fkey" FOREIGN KEY ("curriculum_unit_id") REFERENCES "curriculum_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_schedules" ADD CONSTRAINT "curriculum_schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_schedules" ADD CONSTRAINT "curriculum_schedules_curriculum_material_id_fkey" FOREIGN KEY ("curriculum_material_id") REFERENCES "curriculum_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_schedules" ADD CONSTRAINT "curriculum_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_schedules" ADD CONSTRAINT "curriculum_schedules_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_schedules" ADD CONSTRAINT "curriculum_schedules_current_unit_id_fkey" FOREIGN KEY ("current_unit_id") REFERENCES "curriculum_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_units" ADD CONSTRAINT "curriculum_units_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "curriculum_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_units" ADD CONSTRAINT "curriculum_units_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "curriculum_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_milestones" ADD CONSTRAINT "curriculum_milestones_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "curriculum_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_milestones" ADD CONSTRAINT "curriculum_milestones_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "curriculum_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_milestones" ADD CONSTRAINT "curriculum_milestones_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
