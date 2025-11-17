-- Atlas Knowledge Graph Migration
-- Creates 7 tables for multi-year knowledge tracking

-- 1. ConceptTaxonomy - Canonical concept definitions
CREATE TABLE IF NOT EXISTS "concept_taxonomy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept_name" TEXT NOT NULL UNIQUE,
    "subject" TEXT NOT NULL,
    "grade_level" TEXT,
    "description" TEXT,
    "parent_concept_id" TEXT,
    "aliases" TEXT[],
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "teacher_modified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_taxonomy_parent_concept_id_fkey"
        FOREIGN KEY ("parent_concept_id")
        REFERENCES "concept_taxonomy"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "concept_taxonomy_subject_grade_level_idx"
    ON "concept_taxonomy"("subject", "grade_level");
CREATE INDEX IF NOT EXISTS "concept_taxonomy_concept_name_idx"
    ON "concept_taxonomy"("concept_name");

-- 2. ConceptRelationship - Semantic connections
CREATE TABLE IF NOT EXISTS "concept_relationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source_concept_id" TEXT NOT NULL,
    "target_concept_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "reasoning" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_relationship_source_concept_id_fkey"
        FOREIGN KEY ("source_concept_id")
        REFERENCES "concept_taxonomy"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "concept_relationship_target_concept_id_fkey"
        FOREIGN KEY ("target_concept_id")
        REFERENCES "concept_taxonomy"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "concept_relationship_source_concept_id_target_concept_id_key"
        UNIQUE ("source_concept_id", "target_concept_id")
);

CREATE INDEX IF NOT EXISTS "concept_relationship_source_concept_id_idx"
    ON "concept_relationship"("source_concept_id");
CREATE INDEX IF NOT EXISTS "concept_relationship_target_concept_id_idx"
    ON "concept_relationship"("target_concept_id");

-- 3. StudentConceptMastery - Lifelong mastery tracking
CREATE TABLE IF NOT EXISTS "student_concept_mastery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "overall_mastery_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall_mastery_level" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "trend" TEXT NOT NULL DEFAULT 'STABLE',
    "first_encountered_at" TIMESTAMP(3),
    "last_practiced_at" TIMESTAMP(3),
    "total_practice_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_correct_attempts" INTEGER NOT NULL DEFAULT 0,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "mastery_history" JSONB,
    "graph_position_x" DOUBLE PRECISION,
    "graph_position_y" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_concept_mastery_student_id_fkey"
        FOREIGN KEY ("student_id")
        REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_concept_mastery_concept_id_fkey"
        FOREIGN KEY ("concept_id")
        REFERENCES "concept_taxonomy"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_concept_mastery_student_id_concept_id_key"
        UNIQUE ("student_id", "concept_id")
);

CREATE INDEX IF NOT EXISTS "student_concept_mastery_student_id_idx"
    ON "student_concept_mastery"("student_id");
CREATE INDEX IF NOT EXISTS "student_concept_mastery_concept_id_idx"
    ON "student_concept_mastery"("concept_id");
CREATE INDEX IF NOT EXISTS "student_concept_mastery_overall_mastery_level_idx"
    ON "student_concept_mastery"("overall_mastery_level");

-- 4. ClassConcept - Track concepts taught in specific classes
CREATE TABLE IF NOT EXISTS "class_concept" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "class_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "introduced_at" TIMESTAMP(3),
    "planned_mastery_target" DOUBLE PRECISION,
    "actual_avg_mastery" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_concept_class_id_fkey"
        FOREIGN KEY ("class_id")
        REFERENCES "Class"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_concept_concept_id_fkey"
        FOREIGN KEY ("concept_id")
        REFERENCES "concept_taxonomy"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_concept_class_id_concept_id_key"
        UNIQUE ("class_id", "concept_id")
);

CREATE INDEX IF NOT EXISTS "class_concept_class_id_idx"
    ON "class_concept"("class_id");
CREATE INDEX IF NOT EXISTS "class_concept_concept_id_idx"
    ON "class_concept"("concept_id");

-- 5. ConceptMilestone - Achievement tracking
CREATE TABLE IF NOT EXISTS "concept_milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "milestone_type" TEXT NOT NULL,
    "class_id" TEXT,
    "achieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_milestone_student_id_fkey"
        FOREIGN KEY ("student_id")
        REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "concept_milestone_concept_id_fkey"
        FOREIGN KEY ("concept_id")
        REFERENCES "concept_taxonomy"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "concept_milestone_class_id_fkey"
        FOREIGN KEY ("class_id")
        REFERENCES "Class"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "concept_milestone_student_id_idx"
    ON "concept_milestone"("student_id");
CREATE INDEX IF NOT EXISTS "concept_milestone_concept_id_idx"
    ON "concept_milestone"("concept_id");
CREATE INDEX IF NOT EXISTS "concept_milestone_milestone_type_idx"
    ON "concept_milestone"("milestone_type");

-- 6. ConceptPracticeLog - Detailed practice history
CREATE TABLE IF NOT EXISTS "concept_practice_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "class_id" TEXT,
    "assignment_id" TEXT,
    "question_id" TEXT,
    "was_correct" BOOLEAN NOT NULL,
    "mastery_before" DOUBLE PRECISION,
    "mastery_after" DOUBLE PRECISION,
    "practiced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_practice_log_student_id_fkey"
        FOREIGN KEY ("student_id")
        REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "concept_practice_log_concept_id_fkey"
        FOREIGN KEY ("concept_id")
        REFERENCES "concept_taxonomy"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "concept_practice_log_class_id_fkey"
        FOREIGN KEY ("class_id")
        REFERENCES "Class"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "concept_practice_log_assignment_id_fkey"
        FOREIGN KEY ("assignment_id")
        REFERENCES "Assignment"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "concept_practice_log_student_id_idx"
    ON "concept_practice_log"("student_id");
CREATE INDEX IF NOT EXISTS "concept_practice_log_concept_id_idx"
    ON "concept_practice_log"("concept_id");
CREATE INDEX IF NOT EXISTS "concept_practice_log_practiced_at_idx"
    ON "concept_practice_log"("practiced_at");

-- 7. StudentGradeHistory - Multi-year grade tracking
CREATE TABLE IF NOT EXISTS "student_grade_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "school_year" TEXT NOT NULL,
    "grade_level" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_grade_history_student_id_fkey"
        FOREIGN KEY ("student_id")
        REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_grade_history_school_id_fkey"
        FOREIGN KEY ("school_id")
        REFERENCES "School"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_grade_history_student_id_school_year_key"
        UNIQUE ("student_id", "school_year")
);

CREATE INDEX IF NOT EXISTS "student_grade_history_student_id_idx"
    ON "student_grade_history"("student_id");
CREATE INDEX IF NOT EXISTS "student_grade_history_school_year_idx"
    ON "student_grade_history"("school_year");

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Atlas migration completed successfully!';
    RAISE NOTICE 'Created 7 tables: concept_taxonomy, concept_relationship, student_concept_mastery, class_concept, concept_milestone, concept_practice_log, student_grade_history';
END $$;
