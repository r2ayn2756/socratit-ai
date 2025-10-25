-- AlterTable
ALTER TABLE "concept_masteries" ADD COLUMN     "improvement_rate" DOUBLE PRECISION,
ADD COLUMN     "last_practiced" TIMESTAMP(3),
ADD COLUMN     "practice_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "remediation_needed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suggested_next_concepts" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "student_progress" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "total_assignments" INTEGER NOT NULL DEFAULT 0,
    "completed_assignments" INTEGER NOT NULL DEFAULT 0,
    "in_progress_assignments" INTEGER NOT NULL DEFAULT 0,
    "not_started_assignments" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_grade" DOUBLE PRECISION,
    "trend_direction" "TrendDirection" NOT NULL DEFAULT 'STABLE',
    "trend_percentage" DOUBLE PRECISION,
    "total_time_spent" INTEGER NOT NULL DEFAULT 0,
    "average_time_per_assignment" DOUBLE PRECISION,
    "learning_velocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_progress" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "questions_total" INTEGER NOT NULL,
    "questions_answered" INTEGER NOT NULL DEFAULT 0,
    "questions_correct" INTEGER NOT NULL DEFAULT 0,
    "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "time_spent" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_mastery_paths" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "concept_name" TEXT NOT NULL,
    "prerequisite_id" TEXT,
    "order_index" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "estimated_hours" DOUBLE PRECISION,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_mastery_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_velocity_logs" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "week_end_date" TIMESTAMP(3) NOT NULL,
    "assignments_completed" INTEGER NOT NULL,
    "velocity" DOUBLE PRECISION NOT NULL,
    "average_score" DOUBLE PRECISION,
    "time_spent_minutes" INTEGER NOT NULL,
    "velocity_change" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_velocity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_progress_student_id_idx" ON "student_progress"("student_id");

-- CreateIndex
CREATE INDEX "student_progress_class_id_idx" ON "student_progress"("class_id");

-- CreateIndex
CREATE INDEX "student_progress_school_id_idx" ON "student_progress"("school_id");

-- CreateIndex
CREATE INDEX "student_progress_last_calculated_idx" ON "student_progress"("last_calculated");

-- CreateIndex
CREATE UNIQUE INDEX "student_progress_student_id_class_id_key" ON "student_progress"("student_id", "class_id");

-- CreateIndex
CREATE INDEX "assignment_progress_student_id_idx" ON "assignment_progress"("student_id");

-- CreateIndex
CREATE INDEX "assignment_progress_assignment_id_idx" ON "assignment_progress"("assignment_id");

-- CreateIndex
CREATE INDEX "assignment_progress_class_id_idx" ON "assignment_progress"("class_id");

-- CreateIndex
CREATE INDEX "assignment_progress_school_id_idx" ON "assignment_progress"("school_id");

-- CreateIndex
CREATE INDEX "assignment_progress_status_idx" ON "assignment_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_progress_student_id_assignment_id_key" ON "assignment_progress"("student_id", "assignment_id");

-- CreateIndex
CREATE INDEX "concept_mastery_paths_class_id_idx" ON "concept_mastery_paths"("class_id");

-- CreateIndex
CREATE INDEX "concept_mastery_paths_school_id_idx" ON "concept_mastery_paths"("school_id");

-- CreateIndex
CREATE INDEX "concept_mastery_paths_concept_name_idx" ON "concept_mastery_paths"("concept_name");

-- CreateIndex
CREATE INDEX "concept_mastery_paths_prerequisite_id_idx" ON "concept_mastery_paths"("prerequisite_id");

-- CreateIndex
CREATE UNIQUE INDEX "concept_mastery_paths_class_id_concept_name_key" ON "concept_mastery_paths"("class_id", "concept_name");

-- CreateIndex
CREATE INDEX "learning_velocity_logs_student_id_idx" ON "learning_velocity_logs"("student_id");

-- CreateIndex
CREATE INDEX "learning_velocity_logs_class_id_idx" ON "learning_velocity_logs"("class_id");

-- CreateIndex
CREATE INDEX "learning_velocity_logs_school_id_idx" ON "learning_velocity_logs"("school_id");

-- CreateIndex
CREATE INDEX "learning_velocity_logs_week_start_date_idx" ON "learning_velocity_logs"("week_start_date");

-- CreateIndex
CREATE UNIQUE INDEX "learning_velocity_logs_student_id_class_id_week_start_date_key" ON "learning_velocity_logs"("student_id", "class_id", "week_start_date");

-- AddForeignKey
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_progress" ADD CONSTRAINT "assignment_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_progress" ADD CONSTRAINT "assignment_progress_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_progress" ADD CONSTRAINT "assignment_progress_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_mastery_paths" ADD CONSTRAINT "concept_mastery_paths_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_mastery_paths" ADD CONSTRAINT "concept_mastery_paths_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "concept_mastery_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_velocity_logs" ADD CONSTRAINT "learning_velocity_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_velocity_logs" ADD CONSTRAINT "learning_velocity_logs_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
