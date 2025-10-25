-- CreateEnum
CREATE TYPE "LetterGrade" AS ENUM ('A_PLUS', 'A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'C_MINUS', 'D_PLUS', 'D', 'D_MINUS', 'F');

-- CreateTable
CREATE TABLE "grade_categories" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "drop_lowest" INTEGER NOT NULL DEFAULT 0,
    "late_penalty_per_day" DOUBLE PRECISION,
    "max_late_penalty" DOUBLE PRECISION,
    "allow_extra_credit" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "grade_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "grade_type" TEXT NOT NULL,
    "category_name" TEXT,
    "points_earned" DOUBLE PRECISION NOT NULL,
    "points_possible" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "letter_grade" "LetterGrade",
    "weighted_score" DOUBLE PRECISION,
    "extra_credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "late_penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "curve" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_dropped" BOOLEAN NOT NULL DEFAULT false,
    "grade_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacher_comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grade_categories_class_id_idx" ON "grade_categories"("class_id");

-- CreateIndex
CREATE INDEX "grade_categories_school_id_idx" ON "grade_categories"("school_id");

-- CreateIndex
CREATE INDEX "grades_student_id_idx" ON "grades"("student_id");

-- CreateIndex
CREATE INDEX "grades_class_id_idx" ON "grades"("class_id");

-- CreateIndex
CREATE INDEX "grades_school_id_idx" ON "grades"("school_id");

-- CreateIndex
CREATE INDEX "grades_assignment_id_idx" ON "grades"("assignment_id");

-- CreateIndex
CREATE INDEX "grades_grade_type_idx" ON "grades"("grade_type");

-- CreateIndex
CREATE INDEX "grades_category_name_idx" ON "grades"("category_name");

-- CreateIndex
CREATE INDEX "grades_grade_date_idx" ON "grades"("grade_date");

-- AddForeignKey
ALTER TABLE "grade_categories" ADD CONSTRAINT "grade_categories_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
