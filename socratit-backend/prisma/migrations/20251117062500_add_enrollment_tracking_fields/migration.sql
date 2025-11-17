-- AlterTable: Add enrollment tracking fields to ClassEnrollment
ALTER TABLE "class_enrollments"
ADD COLUMN IF NOT EXISTS "enrollment_start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "enrollment_end_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "exit_reason" TEXT,
ADD COLUMN IF NOT EXISTS "final_grade" TEXT,
ADD COLUMN IF NOT EXISTS "final_grade_percent" DOUBLE PRECISION;
