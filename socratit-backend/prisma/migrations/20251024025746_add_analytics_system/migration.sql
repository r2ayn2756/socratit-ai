-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('NOT_STARTED', 'BEGINNING', 'DEVELOPING', 'PROFICIENT', 'MASTERED');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "concept_masteries" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "subject" TEXT,
    "mastery_level" "MasteryLevel" NOT NULL DEFAULT 'NOT_STARTED',
    "mastery_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "correct_attempts" INTEGER NOT NULL DEFAULT 0,
    "incorrect_attempts" INTEGER NOT NULL DEFAULT 0,
    "trend" "TrendDirection" NOT NULL DEFAULT 'STABLE',
    "previous_percent" DOUBLE PRECISION,
    "weighted_score" DOUBLE PRECISION,
    "last_assessed" TIMESTAMP(3),
    "first_assessed" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_masteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_insights" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "is_struggling" BOOLEAN NOT NULL DEFAULT false,
    "has_missed_assignments" BOOLEAN NOT NULL DEFAULT false,
    "has_declining_grade" BOOLEAN NOT NULL DEFAULT false,
    "has_low_engagement" BOOLEAN NOT NULL DEFAULT false,
    "has_concept_gaps" BOOLEAN NOT NULL DEFAULT false,
    "completion_rate" DOUBLE PRECISION,
    "average_score" DOUBLE PRECISION,
    "class_rank" INTEGER,
    "percentile" DOUBLE PRECISION,
    "avg_time_on_task" DOUBLE PRECISION,
    "total_time_spent" INTEGER,
    "struggling_concepts" JSONB,
    "mastered_concepts" JSONB,
    "recommendations" JSONB,
    "intervention_level" "AlertSeverity" NOT NULL DEFAULT 'LOW',
    "teacher_notes" TEXT,
    "alert_sent" BOOLEAN NOT NULL DEFAULT false,
    "alert_sent_at" TIMESTAMP(3),
    "alert_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "concept_masteries_student_id_idx" ON "concept_masteries"("student_id");

-- CreateIndex
CREATE INDEX "concept_masteries_class_id_idx" ON "concept_masteries"("class_id");

-- CreateIndex
CREATE INDEX "concept_masteries_school_id_idx" ON "concept_masteries"("school_id");

-- CreateIndex
CREATE INDEX "concept_masteries_concept_idx" ON "concept_masteries"("concept");

-- CreateIndex
CREATE INDEX "concept_masteries_mastery_level_idx" ON "concept_masteries"("mastery_level");

-- CreateIndex
CREATE INDEX "concept_masteries_last_assessed_idx" ON "concept_masteries"("last_assessed");

-- CreateIndex
CREATE UNIQUE INDEX "concept_masteries_student_id_class_id_concept_key" ON "concept_masteries"("student_id", "class_id", "concept");

-- CreateIndex
CREATE INDEX "student_insights_student_id_idx" ON "student_insights"("student_id");

-- CreateIndex
CREATE INDEX "student_insights_class_id_idx" ON "student_insights"("class_id");

-- CreateIndex
CREATE INDEX "student_insights_school_id_idx" ON "student_insights"("school_id");

-- CreateIndex
CREATE INDEX "student_insights_is_struggling_idx" ON "student_insights"("is_struggling");

-- CreateIndex
CREATE INDEX "student_insights_intervention_level_idx" ON "student_insights"("intervention_level");

-- CreateIndex
CREATE INDEX "student_insights_last_calculated_idx" ON "student_insights"("last_calculated");

-- CreateIndex
CREATE UNIQUE INDEX "student_insights_student_id_class_id_key" ON "student_insights"("student_id", "class_id");

-- AddForeignKey
ALTER TABLE "concept_masteries" ADD CONSTRAINT "concept_masteries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_masteries" ADD CONSTRAINT "concept_masteries_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_insights" ADD CONSTRAINT "student_insights_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_insights" ADD CONSTRAINT "student_insights_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
