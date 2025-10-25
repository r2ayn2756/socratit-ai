-- AlterTable
ALTER TABLE "concept_masteries" ADD COLUMN     "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recommended_next" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "student_insights" ADD COLUMN     "last_activity_at" TIMESTAMP(3),
ADD COLUMN     "performance_history" JSONB,
ADD COLUMN     "predicted_next_score" DOUBLE PRECISION,
ADD COLUMN     "risk_score" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "streak_days" INTEGER DEFAULT 0;
