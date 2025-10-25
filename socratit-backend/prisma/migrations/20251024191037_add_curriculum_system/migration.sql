-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'UPLOAD_CURRICULUM';
ALTER TYPE "AuditAction" ADD VALUE 'PROCESS_CURRICULUM';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_CURRICULUM';
ALTER TYPE "AuditAction" ADD VALUE 'DOWNLOAD_CURRICULUM';
ALTER TYPE "AuditAction" ADD VALUE 'GENERATE_FROM_CURRICULUM';

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "curriculum_source_id" TEXT;

-- CreateTable
CREATE TABLE "curriculum_materials" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "original_file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "extracted_text" TEXT,
    "text_extraction_error" TEXT,
    "processing_started_at" TIMESTAMP(3),
    "processing_completed_at" TIMESTAMP(3),
    "ai_summary" TEXT,
    "ai_outline" JSONB,
    "suggested_topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learning_objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "curriculum_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_upload_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "curriculum_id" TEXT,
    "action" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "processing_time" INTEGER,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_upload_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_materials_school_id_idx" ON "curriculum_materials"("school_id");

-- CreateIndex
CREATE INDEX "curriculum_materials_teacher_id_idx" ON "curriculum_materials"("teacher_id");

-- CreateIndex
CREATE INDEX "curriculum_materials_processing_status_idx" ON "curriculum_materials"("processing_status");

-- CreateIndex
CREATE INDEX "curriculum_materials_file_type_idx" ON "curriculum_materials"("file_type");

-- CreateIndex
CREATE INDEX "curriculum_materials_created_at_idx" ON "curriculum_materials"("created_at");

-- CreateIndex
CREATE INDEX "curriculum_materials_expires_at_idx" ON "curriculum_materials"("expires_at");

-- CreateIndex
CREATE INDEX "curriculum_materials_is_archived_idx" ON "curriculum_materials"("is_archived");

-- CreateIndex
CREATE INDEX "file_upload_logs_user_id_idx" ON "file_upload_logs"("user_id");

-- CreateIndex
CREATE INDEX "file_upload_logs_school_id_idx" ON "file_upload_logs"("school_id");

-- CreateIndex
CREATE INDEX "file_upload_logs_curriculum_id_idx" ON "file_upload_logs"("curriculum_id");

-- CreateIndex
CREATE INDEX "file_upload_logs_action_idx" ON "file_upload_logs"("action");

-- CreateIndex
CREATE INDEX "file_upload_logs_created_at_idx" ON "file_upload_logs"("created_at");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_curriculum_source_id_fkey" FOREIGN KEY ("curriculum_source_id") REFERENCES "curriculum_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_materials" ADD CONSTRAINT "curriculum_materials_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
