// ============================================================================
// AI SERVICE
// Handles Anthropic Claude integration for quiz generation and grading
// Supports both Claude and OpenAI as fallback
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { env } from '../config/env';

// ============================================================================
// TYPES
// ============================================================================

interface AIQuestionOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface AIGeneratedQuestion {
  type: 'MULTIPLE_CHOICE' | 'FREE_RESPONSE';
  questionText: string;
  points: number;
  concept?: string;
  difficulty?: 'easy' | 'medium' | 'hard';

  // Multiple Choice fields
  options?: AIQuestionOption[];
  correctOption?: 'A' | 'B' | 'C' | 'D';

  // Free Response fields
  correctAnswer?: string;
  rubric?: string;

  explanation?: string;
}

interface AIQuizGenerationResult {
  title: string;
  description: string;
  questions: AIGeneratedQuestion[];
  estimatedTimeMinutes: number;
  totalPoints: number;
}

interface AIGradingResult {
  score: number; // 0-1 scale
  feedback: string;
  isCorrect: boolean;
  confidence: number; // 0-1 scale
  suggestions?: string[];
}

interface AICurriculumAnalysisResult {
  summary: string;
  outline: {
    topics: Array<{
      name: string;
      subtopics: string[];
    }>;
  };
  concepts: string[];
  objectives: string[];
}

// ============================================================================
// AI CLIENTS
// ============================================================================

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || '',
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calls Claude API with a prompt and returns parsed JSON response
 */
async function callClaude(systemPrompt: string, userPrompt: string, maxTokens: number = 2000): Promise<any> {
  try {
    const response = await anthropic.messages.create({
      model: env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text from the response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const text = content.text;

    // Try to parse JSON from the response
    // Claude sometimes wraps JSON in markdown code blocks
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    return JSON.parse(jsonText);
  } catch (error: any) {
    console.error('Error calling Claude API:', error);

    if (error.status === 401) {
      throw new Error('Invalid Anthropic API key. Please check your configuration.');
    }

    if (error.status === 429) {
      throw new Error('Claude rate limit exceeded. Please try again later.');
    }

    throw new Error(`Failed to call Claude: ${error.message}`);
  }
}

/**
 * Calls OpenAI API with a prompt and returns parsed JSON response (fallback)
 */
async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens: number = 2000): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);

    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    }

    if (error.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    }

    throw new Error(`Failed to call OpenAI: ${error.message}`);
  }
}

/**
 * Calls the configured AI provider
 */
async function callAI(systemPrompt: string, userPrompt: string, maxTokens: number = 2000): Promise<any> {
  const provider = env.AI_PROVIDER || 'claude';

  if (provider === 'claude') {
    return await callClaude(systemPrompt, userPrompt, maxTokens);
  } else if (provider === 'openai') {
    return await callOpenAI(systemPrompt, userPrompt, maxTokens);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// ============================================================================
// AI QUIZ GENERATION SERVICE
// ============================================================================

/**
 * Generates an interactive quiz from curriculum content using AI
 * @param curriculumText The curriculum content to generate questions from
 * @param options Configuration options for quiz generation
 * @returns Generated quiz with questions
 */
export async function generateQuizFromCurriculum(
  curriculumText: string,
  options: {
    assignmentType?: 'PRACTICE' | 'QUIZ' | 'TEST' | 'HOMEWORK' | 'CHALLENGE';
    numQuestions?: number;
    questionTypes?: Array<'MULTIPLE_CHOICE' | 'FREE_RESPONSE'>;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    subject?: string;
    gradeLevel?: string;
  } = {}
): Promise<AIQuizGenerationResult> {
  const {
    assignmentType = 'QUIZ',
    numQuestions = 10,
    questionTypes = ['MULTIPLE_CHOICE', 'FREE_RESPONSE'],
    difficulty = 'mixed',
    subject,
    gradeLevel,
  } = options;

  // Calculate question distribution
  const mcPercentage = questionTypes.includes('MULTIPLE_CHOICE')
    ? (questionTypes.includes('FREE_RESPONSE') ? 0.7 : 1.0)
    : 0.0;
  const numMCQuestions = Math.floor(numQuestions * mcPercentage);
  const numFRQuestions = numQuestions - numMCQuestions;

  // Build the prompt
  const systemPrompt = 'You are an expert educational content creator who generates high-quality quiz questions in JSON format.';

  const userPrompt = `Generate an interactive ${assignmentType.toLowerCase()} based on the following curriculum content.

**Curriculum Content:**
${curriculumText}

**Requirements:**
- Generate exactly ${numQuestions} questions total
- ${numMCQuestions > 0 ? `${numMCQuestions} multiple choice questions with 4 options each (A, B, C, D)` : ''}
- ${numFRQuestions > 0 ? `${numFRQuestions} free response questions` : ''}
- Difficulty level: ${difficulty}
${subject ? `- Subject: ${subject}` : ''}
${gradeLevel ? `- Grade level: ${gradeLevel}` : ''}
- Each question should test understanding of key concepts
- Include explanations for correct answers
- Assign point values based on question difficulty (5-20 points each)
- Identify the main concept being tested for each question

**Response Format (JSON):**
{
  "title": "Descriptive title for the assignment",
  "description": "Brief description of what this assignment covers",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" or "FREE_RESPONSE",
      "questionText": "The question text",
      "points": 10,
      "concept": "main concept being tested",
      "difficulty": "easy" | "medium" | "hard",

      // For MULTIPLE_CHOICE only:
      "options": [
        {"letter": "A", "text": "Option A text"},
        {"letter": "B", "text": "Option B text"},
        {"letter": "C", "text": "Option C text"},
        {"letter": "D", "text": "Option D text"}
      ],
      "correctOption": "A" | "B" | "C" | "D",

      // For FREE_RESPONSE only:
      "correctAnswer": "A sample correct answer for grading reference",
      "rubric": "Detailed grading rubric with key points to look for",

      "explanation": "Explanation of why this answer is correct"
    }
  ],
  "estimatedTimeMinutes": 30
}

Respond ONLY with valid JSON. Do not include any other text or markdown formatting.`;

  try {
    const result = await callAI(systemPrompt, userPrompt, 3000) as AIQuizGenerationResult;

    // Calculate total points
    result.totalPoints = result.questions.reduce((sum, q) => sum + q.points, 0);

    // Validate the response
    if (!result.questions || result.questions.length === 0) {
      throw new Error('No questions generated');
    }

    // Validate each question has required fields
    result.questions.forEach((q, index) => {
      if (!q.questionText || !q.type) {
        throw new Error(`Invalid question at index ${index}`);
      }
      if (q.type === 'MULTIPLE_CHOICE' && (!q.options || !q.correctOption)) {
        throw new Error(`Multiple choice question at index ${index} missing options or correct answer`);
      }
      if (q.type === 'FREE_RESPONSE' && !q.correctAnswer) {
        throw new Error(`Free response question at index ${index} missing correct answer`);
      }
    });

    return result;
  } catch (error: any) {
    console.error('Error generating quiz from curriculum:', error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
}

// ============================================================================
// AI GRADING SERVICE
// ============================================================================

/**
 * Grades a free response answer using AI
 * @param studentAnswer The student's answer
 * @param correctAnswer The reference correct answer
 * @param rubric Optional grading rubric
 * @param questionText The original question text
 * @param maxPoints Maximum points for this question
 * @returns Grading result with score and feedback
 */
export async function gradeFreeResponse(
  studentAnswer: string,
  correctAnswer: string,
  rubric: string | null,
  questionText: string,
  _maxPoints: number
): Promise<AIGradingResult> {
  const systemPrompt = 'You are an expert educational grader who provides fair, constructive feedback in JSON format.';

  const userPrompt = `Grade the following student's free response answer.

**Question:**
${questionText}

**Reference Answer:**
${correctAnswer}

${rubric ? `**Grading Rubric:**\n${rubric}\n` : ''}

**Student's Answer:**
${studentAnswer}

**Instructions:**
- Evaluate the student's answer against the reference answer and rubric
- Assign a score from 0.0 to 1.0 (where 1.0 is perfect)
- Provide constructive feedback
- Be fair and consider partial credit for partially correct answers
- Note your confidence level in the grading (0.0 to 1.0)

**Response Format (JSON):**
{
  "score": 0.85,
  "feedback": "Your answer demonstrates understanding of... However, you could improve by...",
  "isCorrect": true or false (true if score >= 0.7),
  "confidence": 0.9,
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Respond ONLY with valid JSON. Do not include any other text.`;

  try {
    const result = await callAI(systemPrompt, userPrompt, 500) as AIGradingResult;

    // Validate the response
    if (typeof result.score !== 'number' || result.score < 0 || result.score > 1) {
      throw new Error('Invalid score from AI grading');
    }

    if (!result.feedback) {
      throw new Error('No feedback provided by AI grading');
    }

    // Ensure confidence is set
    if (!result.confidence) {
      result.confidence = 0.8; // Default confidence
    }

    return result;
  } catch (error: any) {
    console.error('Error grading free response:', error);
    throw new Error(`Failed to grade response: ${error.message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates AI API key is configured
 */
export function isAIConfigured(): boolean {
  const provider = env.AI_PROVIDER || 'claude';

  if (provider === 'claude') {
    return !!(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.length > 0);
  } else if (provider === 'openai') {
    return !!(env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-openai-api-key');
  }

  return false;
}

/**
 * Tests AI connection
 */
export async function testAIConnection(): Promise<boolean> {
  if (!isAIConfigured()) {
    return false;
  }

  try {
    const provider = env.AI_PROVIDER || 'claude';

    if (provider === 'claude') {
      await anthropic.messages.create({
        model: env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }],
      });
    } else if (provider === 'openai') {
      await openai.chat.completions.create({
        model: env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5,
      });
    }

    return true;
  } catch (error) {
    console.error('AI connection test failed:', error);
    return false;
  }
}

// Legacy function names for backward compatibility
export const isOpenAIConfigured = isAIConfigured;
export const testOpenAIConnection = testAIConnection;

// ============================================================================
// CURRICULUM ANALYSIS SERVICE
// ============================================================================

/**
 * Analyzes curriculum content and extracts key information
 * @param curriculumText Extracted text from uploaded curriculum file
 * @param options Additional analysis options
 * @returns Analysis results with summary, outline, concepts, and objectives
 */
export async function analyzeCurriculumContent(
  curriculumText: string,
  options: {
    subject?: string;
    gradeLevel?: string;
    focusAreas?: string[];
  } = {}
): Promise<AICurriculumAnalysisResult> {
  const { subject, gradeLevel, focusAreas } = options;

  const systemPrompt = 'You are an expert educational content analyst who provides structured analysis in JSON format.';

  const userPrompt = `Analyze the following curriculum content and provide a structured summary.

**Curriculum Content:**
${curriculumText}

${subject ? `**Subject:** ${subject}` : ''}
${gradeLevel ? `**Grade Level:** ${gradeLevel}` : ''}
${focusAreas && focusAreas.length > 0 ? `**Focus Areas:** ${focusAreas.join(', ')}` : ''}

**Instructions:**
Analyze this educational content and provide:
1. A concise summary (3-5 sentences) highlighting the main topics
2. A structured outline organized into topics and subtopics
3. A list of specific concepts/skills that are covered (e.g., "quadratic equations", "photosynthesis", "scientific method")
4. Learning objectives in measurable terms (e.g., "Students will be able to solve quadratic equations using the quadratic formula")

**Response Format (JSON):**
{
  "summary": "Clear 3-5 sentence overview of the curriculum content...",
  "outline": {
    "topics": [
      {
        "name": "Topic 1",
        "subtopics": ["Subtopic 1.1", "Subtopic 1.2", "Subtopic 1.3"]
      },
      {
        "name": "Topic 2",
        "subtopics": ["Subtopic 2.1", "Subtopic 2.2"]
      }
    ]
  },
  "concepts": ["concept1", "concept2", "concept3", ...],
  "objectives": [
    "Students will be able to...",
    "Students will understand...",
    "Students will demonstrate..."
  ]
}

Respond ONLY with valid JSON. Do not include any other text or markdown formatting.`;

  try {
    const result = await callAI(systemPrompt, userPrompt, 2000) as AICurriculumAnalysisResult;

    // Validate the response
    if (!result.summary || !result.outline || !result.concepts || !result.objectives) {
      throw new Error('Incomplete curriculum analysis from AI');
    }

    return result;
  } catch (error: any) {
    console.error('Error analyzing curriculum content:', error);
    throw new Error(`Failed to analyze curriculum: ${error.message}`);
  }
}

// ============================================================================
// AI TEACHING ASSISTANT - CHAT COMPLETION METHODS
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface StreamCallback {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string, usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
  onError: (error: Error) => void;
}

/**
 * Standard chat completion (non-streaming)
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<{
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}> {
  const {
    temperature = 0.7,
    maxTokens = 500,
    model,
  } = options;

  const provider = env.AI_PROVIDER || 'claude';

  try {
    if (provider === 'claude') {
      // Convert messages format for Claude
      const systemMessage = messages.find((m) => m.role === 'system');
      const userMessages = messages.filter((m) => m.role !== 'system');

      const claudeMessages = userMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await anthropic.messages.create({
        model: model || env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        system: systemMessage?.content,
        messages: claudeMessages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const usage = {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      };

      return { content: content.text, usage };
    } else {
      // Use OpenAI
      const response = await openai.chat.completions.create({
        model: model || env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      };

      return { content, usage };
    }
  } catch (error: any) {
    console.error('Error in chat completion:', error);

    if (error.status === 401 || error.code === 'invalid_api_key') {
      throw new Error('Invalid AI API key');
    }

    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      throw new Error('AI rate limit exceeded. Please try again in a moment.');
    }

    throw new Error(`Chat completion failed: ${error.message}`);
  }
}

/**
 * Streaming chat completion (token-by-token)
 * Perfect for real-time UI updates via WebSocket
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  callback: StreamCallback,
  options: ChatCompletionOptions = {}
): Promise<void> {
  const {
    temperature = 0.7,
    maxTokens = 500,
    model,
  } = options;

  const provider = env.AI_PROVIDER || 'claude';

  try {
    if (provider === 'claude') {
      // Convert messages format for Claude
      const systemMessage = messages.find((m) => m.role === 'system');
      const userMessages = messages.filter((m) => m.role !== 'system');

      const claudeMessages = userMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const stream = await anthropic.messages.stream({
        model: model || env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        system: systemMessage?.content,
        messages: claudeMessages,
      });

      let fullResponse = '';
      let inputTokens = 0;
      let outputTokens = 0;

      stream.on('text', (text) => {
        fullResponse += text;
        callback.onToken(text);
      });

      stream.on('message', (message) => {
        inputTokens = message.usage.input_tokens;
        outputTokens = message.usage.output_tokens;
      });

      await stream.finalMessage();

      callback.onComplete(fullResponse, {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      });
    } else {
      // Use OpenAI streaming
      const stream = await openai.chat.completions.create({
        model: model || env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      let fullResponse = '';
      let promptTokens = 0;
      let completionTokens = 0;

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';

        if (token) {
          fullResponse += token;
          completionTokens++; // Approximate
          callback.onToken(token);
        }

        // Capture usage if available (usually in last chunk)
        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens || 0;
          completionTokens = chunk.usage.completion_tokens || 0;
        }
      }

      // Estimate prompt tokens if not provided
      if (promptTokens === 0) {
        promptTokens = estimateTokens(messages.map((m) => m.content).join(' '));
      }

      const totalTokens = promptTokens + completionTokens;

      callback.onComplete(fullResponse, {
        promptTokens,
        completionTokens,
        totalTokens,
      });
    }
  } catch (error: any) {
    console.error('Error in streaming chat completion:', error);

    if (error.status === 401 || error.code === 'invalid_api_key') {
      callback.onError(new Error('Invalid AI API key'));
      return;
    }

    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      callback.onError(new Error('AI rate limit exceeded'));
      return;
    }

    callback.onError(new Error(`Streaming failed: ${error.message}`));
  }
}

/**
 * Estimate token count (rough approximation)
 * ~4 characters = 1 token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost of AI API call
 * Based on Claude Haiku and GPT-3.5-turbo pricing
 */
export function calculateCost(usage: {
  promptTokens: number;
  completionTokens: number;
}): number {
  const provider = env.AI_PROVIDER || 'claude';

  if (provider === 'claude') {
    // Claude Haiku pricing (as of 2024)
    const COST_PER_1M_INPUT = 0.25; // $0.25 per 1M input tokens
    const COST_PER_1M_OUTPUT = 1.25; // $1.25 per 1M output tokens

    const inputCost = (usage.promptTokens / 1_000_000) * COST_PER_1M_INPUT;
    const outputCost = (usage.completionTokens / 1_000_000) * COST_PER_1M_OUTPUT;

    return inputCost + outputCost;
  } else {
    // GPT-3.5-turbo pricing
    const COST_PER_1M_INPUT = 0.50; // $0.50 per 1M input tokens
    const COST_PER_1M_OUTPUT = 1.50; // $1.50 per 1M output tokens

    const inputCost = (usage.promptTokens / 1_000_000) * COST_PER_1M_INPUT;
    const outputCost = (usage.completionTokens / 1_000_000) * COST_PER_1M_OUTPUT;

    return inputCost + outputCost;
  }
}

/**
 * Extract concepts from text using AI
 * Used for dual concept extraction (AI + manual matching)
 */
export async function extractConcepts(
  text: string,
  subject?: string
): Promise<string[]> {
  const systemPrompt = 'You extract academic concepts from text and return them as a JSON array.';

  const userPrompt = `Extract the key academic concepts discussed in this text. Return ONLY a JSON array of concept names.

${subject ? `Subject: ${subject}` : ''}

Text: ${text}

Examples of concepts: "quadratic equations", "photosynthesis", "Newton's laws", "cell division", etc.

Respond with ONLY the JSON array, nothing else.`;

  try {
    const result = await callAI(systemPrompt, userPrompt, 200);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error extracting concepts:', error);
    return [];
  }
}
