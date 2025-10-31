-- CreateTable
CREATE TABLE "class_lessons" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lesson_date" TIMESTAMP(3) NOT NULL,
    "duration_seconds" INTEGER,
    "summary" TEXT NOT NULL,
    "key_concepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "action_items" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "homework" TEXT,
    "full_transcript" TEXT,
    "teacher_notes" TEXT,
    "ai_model" TEXT,
    "processing_time" INTEGER,
    "confidence_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "class_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_lessons_class_id_idx" ON "class_lessons"("class_id");

-- CreateIndex
CREATE INDEX "class_lessons_school_id_idx" ON "class_lessons"("school_id");

-- CreateIndex
CREATE INDEX "class_lessons_teacher_id_idx" ON "class_lessons"("teacher_id");

-- CreateIndex
CREATE INDEX "class_lessons_lesson_date_idx" ON "class_lessons"("lesson_date");

-- CreateIndex
CREATE INDEX "class_lessons_created_at_idx" ON "class_lessons"("created_at");

-- AddForeignKey
ALTER TABLE "class_lessons" ADD CONSTRAINT "class_lessons_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_lessons" ADD CONSTRAINT "class_lessons_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_lessons" ADD CONSTRAINT "class_lessons_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
