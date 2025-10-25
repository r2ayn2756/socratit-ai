/**
 * AI PROMPT SERVICE
 * Manages AI prompt templates and builds dynamic prompts
 * Supports variable substitution and context injection
 */

import { PrismaClient, AIPromptTemplate } from '@prisma/client';
import { prisma } from '../config/database';
import { StudentContext } from './aiContext.service';

export interface PromptBuildOptions {
  context: StudentContext;
  conversationType: string;
  concept?: string;
  questionText?: string;
  studentAttempts?: number;
}

export class AIPromptService {
  /**
   * Get appropriate template for conversation type
   */
  async getTemplate(
    templateType: string,
    schoolId?: string,
    teacherId?: string
  ): Promise<AIPromptTemplate | null> {
    // Priority: Teacher-specific > School-specific > System default

    if (teacherId) {
      const teacherTemplate = await prisma.aIPromptTemplate.findFirst({
        where: {
          templateType,
          teacherId,
          isActive: true,
        },
      });
      if (teacherTemplate) return teacherTemplate;
    }

    if (schoolId) {
      const schoolTemplate = await prisma.aIPromptTemplate.findFirst({
        where: {
          templateType,
          schoolId,
          teacherId: null,
          isActive: true,
        },
      });
      if (schoolTemplate) return schoolTemplate;
    }

    // Fall back to system default
    const defaultTemplate = await prisma.aIPromptTemplate.findFirst({
      where: {
        templateType,
        schoolId: null,
        teacherId: null,
        isDefault: true,
        isActive: true,
      },
    });

    return defaultTemplate;
  }

  /**
   * Build system prompt with variable substitution
   */
  async buildSystemPrompt(
    options: PromptBuildOptions,
    schoolId?: string,
    teacherId?: string
  ): Promise<string> {
    const template = await this.getTemplate(
      options.conversationType,
      schoolId,
      teacherId
    );

    if (!template) {
      // Fallback to basic prompt if no template found
      return this.buildBasicPrompt(options);
    }

    let prompt = template.systemPrompt;

    // Variable substitution
    prompt = this.substituteVariables(prompt, options);

    return prompt;
  }

  /**
   * Substitute variables in prompt template
   */
  private substituteVariables(
    prompt: string,
    options: PromptBuildOptions
  ): string {
    const { context } = options;

    const variables: Record<string, string> = {
      firstName: context.firstName,
      gradeLevel: context.gradeLevel,
      className: context.className || 'your class',
      subject: context.subject || 'this subject',
      classGradeLevel: context.classGradeLevel || context.gradeLevel,
      averageGrade: context.averageGrade?.toString() || 'unknown',
      strugglingConcepts: context.strugglingConcepts
        .map((c) => c.concept)
        .join(', ') || 'none identified yet',
      masteredConcepts: context.masteredConcepts.join(', ') || 'still building',
      assignmentTitle: context.assignmentContext?.title || '',
      assignmentType: context.assignmentContext?.type || '',
      totalQuestions: context.assignmentContext?.totalQuestions?.toString() || '',
      questionsCompleted: context.assignmentContext?.questionsCompleted?.toString() || '',
      currentScore: context.assignmentContext?.currentScore?.toString() || '',
      concept: options.concept || '',
      questionText: options.questionText || '',
      studentAttempts: options.studentAttempts?.toString() || '',
    };

    // Replace all {variableName} with actual values
    let result = prompt;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  /**
   * Build basic prompt when no template is available
   */
  private buildBasicPrompt(options: PromptBuildOptions): string {
    const { context, conversationType } = options;

    let prompt = `You are a helpful and encouraging AI tutor for ${context.gradeLevel} students.`;

    if (context.className) {
      prompt += ` You are helping with ${context.className}`;
      if (context.subject) prompt += ` (${context.subject})`;
      prompt += `.`;
    }

    prompt += `\n\nYour goal is to help students learn and understand concepts, NOT to give direct answers.`;
    prompt += `\nUse the Socratic method: ask guiding questions and provide hints.`;
    prompt += `\nBe encouraging and patient. Celebrate effort and progress.`;
    prompt += `\nBreak complex problems into smaller, manageable steps.`;

    if (context.strugglingConcepts.length > 0) {
      prompt += `\n\nThe student is currently struggling with: ${context.strugglingConcepts.map((c) => c.concept).join(', ')}.`;
      prompt += `\nProvide extra support and scaffolding for these topics.`;
    }

    if (context.masteredConcepts.length > 0) {
      prompt += `\n\nThe student has mastered: ${context.masteredConcepts.join(', ')}.`;
      prompt += `\nYou can reference these concepts to build connections.`;
    }

    if (conversationType === 'ASSIGNMENT_HELP' && context.assignmentContext) {
      const ac = context.assignmentContext;
      prompt += `\n\nThe student is working on: "${ac.title}"`;
      prompt += `\nProgress: ${ac.questionsCompleted}/${ac.totalQuestions} questions completed.`;
      if (ac.concepts.length > 0) {
        prompt += `\nConcepts covered: ${ac.concepts.join(', ')}.`;
      }
    }

    prompt += `\n\nIMPORTANT RULES:`;
    prompt += `\n- NEVER give direct answers to homework or assignment questions`;
    prompt += `\n- Guide students to discover answers themselves`;
    prompt += `\n- If asked for "the answer", politely redirect to learning`;
    prompt += `\n- Provide hints progressively, starting with conceptual reminders`;
    prompt += `\n- Use examples that are similar but not identical to the question`;

    return prompt;
  }

  /**
   * Build hint prompt for specific question
   */
  buildHintPrompt(
    questionText: string,
    concept: string,
    attemptNumber: number,
    context: StudentContext
  ): string {
    let prompt = `The student ${context.firstName} is stuck on this question:\n\n"${questionText}"\n\n`;
    prompt += `This is about the concept: ${concept}\n`;
    prompt += `This is attempt #${attemptNumber}\n\n`;

    if (attemptNumber === 1) {
      prompt += `Provide a LEVEL 1 hint: Remind them of the key concept without giving away the approach.`;
    } else if (attemptNumber === 2) {
      prompt += `Provide a LEVEL 2 hint: Suggest an approach or strategy to solve this type of problem.`;
    } else {
      prompt += `Provide a LEVEL 3 hint: Walk through a similar example (but don't solve their exact question).`;
    }

    prompt += `\n\nKeep your hint concise (2-3 sentences max).`;
    prompt += `\nBe encouraging and positive.`;

    return prompt;
  }

  /**
   * Create custom template (teacher-specific)
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    templateType: string;
    systemPrompt: string;
    schoolId?: string;
    teacherId?: string;
    temperature?: number;
    maxTokens?: number;
    model?: string;
    allowDirectAnswers?: boolean;
    useExamples?: boolean;
    useSocraticMethod?: boolean;
  }): Promise<AIPromptTemplate> {
    const template = await prisma.aIPromptTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        templateType: data.templateType,
        systemPrompt: data.systemPrompt,
        schoolId: data.schoolId,
        teacherId: data.teacherId,
        temperature: data.temperature ?? 0.7,
        maxTokens: data.maxTokens ?? 500,
        model: data.model ?? 'gpt-3.5-turbo',
        allowDirectAnswers: data.allowDirectAnswers ?? false,
        useExamples: data.useExamples ?? true,
        useSocraticMethod: data.useSocraticMethod ?? true,
        isActive: true,
        isDefault: false,
      },
    });

    return template;
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    updates: Partial<AIPromptTemplate>
  ): Promise<AIPromptTemplate> {
    const template = await prisma.aIPromptTemplate.update({
      where: { id },
      data: updates,
    });

    return template;
  }

  /**
   * Get all templates for school or teacher
   */
  async listTemplates(schoolId?: string, teacherId?: string) {
    const where: any = {
      isActive: true,
    };

    if (teacherId) {
      where.teacherId = teacherId;
    } else if (schoolId) {
      where.schoolId = schoolId;
      where.teacherId = null;
    } else {
      where.schoolId = null;
      where.teacherId = null;
    }

    const templates = await prisma.aIPromptTemplate.findMany({
      where,
      orderBy: { templateType: 'asc' },
    });

    return templates;
  }

  /**
   * Increment template usage count
   */
  async trackUsage(templateId: string): Promise<void> {
    await prisma.aIPromptTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }
}

export default new AIPromptService();
