-- CreateEnum
CREATE TYPE "AIMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AIConversationType" AS ENUM ('GENERAL_HELP', 'ASSIGNMENT_HELP', 'CONCEPT_REVIEW', 'HOMEWORK_HELP', 'EXAM_PREP');

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT,
    "school_id" TEXT NOT NULL,
    "title" TEXT,
    "conversation_type" "AIConversationType" NOT NULL DEFAULT 'GENERAL_HELP',
    "assignment_id" TEXT,
    "concept_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_shared_with_teacher" BOOLEAN NOT NULL DEFAULT false,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "helpfulness_rating" DOUBLE PRECISION,
    "resolved_issue" BOOLEAN,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '90 days',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "AIMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "temperature" DOUBLE PRECISION,
    "context_used" JSONB,
    "raw_prompt" TEXT,
    "was_helpful" BOOLEAN,
    "feedback_note" TEXT,
    "flagged_content" BOOLEAN NOT NULL DEFAULT false,
    "flag_reason" TEXT,
    "reviewed_by_teacher" BOOLEAN NOT NULL DEFAULT false,
    "cited_questions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cited_concepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cited_assignments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "response_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interaction_logs" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "student_question" TEXT,
    "ai_response" TEXT,
    "was_successful" BOOLEAN NOT NULL DEFAULT true,
    "concept_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignment_id" TEXT,
    "class_id" TEXT,
    "question_id" TEXT,
    "response_time" INTEGER,
    "tokens_used" INTEGER,
    "cost_usd" DOUBLE PRECISION,
    "lead_to_correct_answer" BOOLEAN,
    "concept_mastery_improved" BOOLEAN,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_teacher_insights" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "period_type" TEXT NOT NULL DEFAULT 'daily',
    "total_conversations" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "average_session_length" DOUBLE PRECISION,
    "common_questions" JSONB,
    "struggling_concepts" JSONB,
    "most_active_students" JSONB,
    "problems_solved" INTEGER DEFAULT 0,
    "average_helpfulness" DOUBLE PRECISION,
    "concepts_improved" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intervention_needed" JSONB,
    "suggested_topics" JSONB,
    "total_tokens_used" INTEGER NOT NULL DEFAULT 0,
    "total_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_teacher_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompt_templates" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "teacher_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template_type" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "available_variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER NOT NULL DEFAULT 500,
    "model" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "top_p" DOUBLE PRECISION DEFAULT 1.0,
    "allow_direct_answers" BOOLEAN NOT NULL DEFAULT false,
    "use_examples" BOOLEAN NOT NULL DEFAULT true,
    "use_socratic_method" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_conversations_student_id_idx" ON "ai_conversations"("student_id");

-- CreateIndex
CREATE INDEX "ai_conversations_class_id_idx" ON "ai_conversations"("class_id");

-- CreateIndex
CREATE INDEX "ai_conversations_school_id_idx" ON "ai_conversations"("school_id");

-- CreateIndex
CREATE INDEX "ai_conversations_assignment_id_idx" ON "ai_conversations"("assignment_id");

-- CreateIndex
CREATE INDEX "ai_conversations_conversation_type_idx" ON "ai_conversations"("conversation_type");

-- CreateIndex
CREATE INDEX "ai_conversations_is_active_idx" ON "ai_conversations"("is_active");

-- CreateIndex
CREATE INDEX "ai_conversations_is_shared_with_teacher_idx" ON "ai_conversations"("is_shared_with_teacher");

-- CreateIndex
CREATE INDEX "ai_conversations_last_message_at_idx" ON "ai_conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "ai_conversations_expires_at_idx" ON "ai_conversations"("expires_at");

-- CreateIndex
CREATE INDEX "ai_conversations_deleted_at_idx" ON "ai_conversations"("deleted_at");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_messages_role_idx" ON "ai_messages"("role");

-- CreateIndex
CREATE INDEX "ai_messages_flagged_content_idx" ON "ai_messages"("flagged_content");

-- CreateIndex
CREATE INDEX "ai_messages_created_at_idx" ON "ai_messages"("created_at");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_conversation_id_idx" ON "ai_interaction_logs"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_student_id_idx" ON "ai_interaction_logs"("student_id");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_school_id_idx" ON "ai_interaction_logs"("school_id");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_interaction_type_idx" ON "ai_interaction_logs"("interaction_type");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_assignment_id_idx" ON "ai_interaction_logs"("assignment_id");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_class_id_idx" ON "ai_interaction_logs"("class_id");

-- CreateIndex
CREATE INDEX "ai_interaction_logs_created_at_idx" ON "ai_interaction_logs"("created_at");

-- CreateIndex
CREATE INDEX "ai_teacher_insights_teacher_id_idx" ON "ai_teacher_insights"("teacher_id");

-- CreateIndex
CREATE INDEX "ai_teacher_insights_class_id_idx" ON "ai_teacher_insights"("class_id");

-- CreateIndex
CREATE INDEX "ai_teacher_insights_school_id_idx" ON "ai_teacher_insights"("school_id");

-- CreateIndex
CREATE INDEX "ai_teacher_insights_period_start_idx" ON "ai_teacher_insights"("period_start");

-- CreateIndex
CREATE INDEX "ai_teacher_insights_period_end_idx" ON "ai_teacher_insights"("period_end");

-- CreateIndex
CREATE INDEX "ai_teacher_insights_period_type_idx" ON "ai_teacher_insights"("period_type");

-- CreateIndex
CREATE UNIQUE INDEX "ai_teacher_insights_class_id_period_start_period_end_key" ON "ai_teacher_insights"("class_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_school_id_idx" ON "ai_prompt_templates"("school_id");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_teacher_id_idx" ON "ai_prompt_templates"("teacher_id");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_template_type_idx" ON "ai_prompt_templates"("template_type");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_is_active_idx" ON "ai_prompt_templates"("is_active");

-- CreateIndex
CREATE INDEX "ai_prompt_templates_is_default_idx" ON "ai_prompt_templates"("is_default");

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interaction_logs" ADD CONSTRAINT "ai_interaction_logs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_teacher_insights" ADD CONSTRAINT "ai_teacher_insights_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
