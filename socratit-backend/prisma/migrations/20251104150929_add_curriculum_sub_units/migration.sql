-- CreateTable
CREATE TABLE "curriculum_sub_units" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "concepts" TEXT[],
    "learning_objectives" TEXT[],
    "estimated_hours" DOUBLE PRECISION NOT NULL,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "teacher_modified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "curriculum_sub_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_sub_units_unit_id_idx" ON "curriculum_sub_units"("unit_id");

-- CreateIndex
CREATE INDEX "curriculum_sub_units_school_id_idx" ON "curriculum_sub_units"("school_id");

-- CreateIndex
CREATE INDEX "curriculum_sub_units_order_index_idx" ON "curriculum_sub_units"("order_index");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_sub_units_unit_id_order_index_key" ON "curriculum_sub_units"("unit_id", "order_index");

-- AddForeignKey
ALTER TABLE "curriculum_sub_units" ADD CONSTRAINT "curriculum_sub_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "curriculum_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_sub_units" ADD CONSTRAINT "curriculum_sub_units_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add curriculum_sub_unit_id to assignments table
ALTER TABLE "assignments" ADD COLUMN "curriculum_sub_unit_id" TEXT;

-- CreateIndex
CREATE INDEX "assignments_curriculum_sub_unit_id_idx" ON "assignments"("curriculum_sub_unit_id");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_curriculum_sub_unit_id_fkey" FOREIGN KEY ("curriculum_sub_unit_id") REFERENCES "curriculum_sub_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
