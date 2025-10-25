-- AlterTable
ALTER TABLE "ai_conversations" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '90 days';
