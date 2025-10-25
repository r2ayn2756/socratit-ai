-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_CLASS';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_CLASS';
ALTER TYPE "AuditAction" ADD VALUE 'ENROLL_STUDENT';
ALTER TYPE "AuditAction" ADD VALUE 'APPROVE_ENROLLMENT';
ALTER TYPE "AuditAction" ADD VALUE 'REJECT_ENROLLMENT';
ALTER TYPE "AuditAction" ADD VALUE 'REMOVE_STUDENT';
ALTER TYPE "AuditAction" ADD VALUE 'GENERATE_CLASS_CODE';
ALTER TYPE "AuditAction" ADD VALUE 'ADD_CLASS_TEACHER';
ALTER TYPE "AuditAction" ADD VALUE 'REMOVE_CLASS_TEACHER';

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "grade_level" TEXT,
    "academic_year" TEXT NOT NULL,
    "period" TEXT,
    "room" TEXT,
    "schedule_time" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "class_code" TEXT NOT NULL,
    "code_expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_teachers" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_enrollments" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classes_class_code_key" ON "classes"("class_code");

-- CreateIndex
CREATE INDEX "classes_school_id_idx" ON "classes"("school_id");

-- CreateIndex
CREATE INDEX "classes_class_code_idx" ON "classes"("class_code");

-- CreateIndex
CREATE INDEX "classes_academic_year_idx" ON "classes"("academic_year");

-- CreateIndex
CREATE INDEX "classes_is_active_idx" ON "classes"("is_active");

-- CreateIndex
CREATE INDEX "class_teachers_class_id_idx" ON "class_teachers"("class_id");

-- CreateIndex
CREATE INDEX "class_teachers_teacher_id_idx" ON "class_teachers"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_teachers_class_id_teacher_id_key" ON "class_teachers"("class_id", "teacher_id");

-- CreateIndex
CREATE INDEX "class_enrollments_class_id_idx" ON "class_enrollments"("class_id");

-- CreateIndex
CREATE INDEX "class_enrollments_student_id_idx" ON "class_enrollments"("student_id");

-- CreateIndex
CREATE INDEX "class_enrollments_status_idx" ON "class_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_class_id_student_id_key" ON "class_enrollments"("class_id", "student_id");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
