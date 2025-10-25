-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'AI_CONVERSATION_SHARED';
ALTER TYPE "NotificationType" ADD VALUE 'AI_STUDENT_STRUGGLING';
ALTER TYPE "NotificationType" ADD VALUE 'AI_HELP_REQUEST';

-- AlterTable
ALTER TABLE "ai_conversations" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '90 days';
