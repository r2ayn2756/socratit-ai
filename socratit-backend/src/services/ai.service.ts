// ============================================================================
// AI SERVICE
// Handles Google Gemini integration for quiz generation and grading
// Supports Gemini, Claude, and OpenAI as fallback
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
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

// Enhanced curriculum scheduling interfaces
interface AISchedulingSubUnit {
  name: string;
  description: string;
  concepts: string[];
  learningObjectives: string[];
  estimatedHours: number;
  orderIndex: number;
}

interface AISchedulingUnit {
  title: string;
  description: string;
  subUnits: AISchedulingSubUnit[]; // Changed from topics to subUnits
  estimatedWeeks: number;
  estimatedHours: number;
  confidenceScore: number;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  difficultyReasoning: string;
  prerequisiteTopics: string[];
  buildUponTopics: string[];
  orderInSequence: number;
  suggestedAssessments: Array<{
    type: 'quiz' | 'test' | 'project' | 'homework';
    timing: 'beginning' | 'middle' | 'end';
    estimatedQuestions: number;
  }>;
}

interface AISchedulingMetadata {
  totalUnits: number;
  estimatedTotalWeeks: number;
  difficultyProgression: 'linear' | 'stepped' | 'spiral';
  recommendedPacing: 'standard' | 'accelerated' | 'extended';
  gradeLevel: string;
  subject: string;
}

interface AIScheduleGenerationResult {
  units: AISchedulingUnit[];
  metadata: AISchedulingMetadata;
}

interface AIScheduleRefinementResult {
  response: string;
  suggestedChanges: Array<{
    unitId: string;
    unitTitle: string;
    field: string;
    currentValue: any;
    suggestedValue: any;
    reasoning: string;
  }>;
}

// ============================================================================
// AI CLIENTS - LAZY INITIALIZATION
// ============================================================================

// Debug logging
console.log('🔍 AI Service Initialization:');
console.log('  AI_PROVIDER:', env.AI_PROVIDER);
console.log('  GEMINI_API_KEY exists:', !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0));
console.log('  GEMINI_API_KEY length:', env.GEMINI_API_KEY?.length || 0);
console.log('  GEMINI_MODEL:', env.GEMINI_MODEL);
console.log('  ANTHROPIC_API_KEY exists:', !!(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.length > 0));
console.log('  OPENAI_API_KEY exists:', !!(env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 0));

// Lazy initialization - clients are created on first use to avoid empty string issues
let geminiClient: GoogleGenerativeAI | null = null;
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.length === 0) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    console.log('🔑 Initializing Gemini client with key length:', env.GEMINI_API_KEY.length);
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return geminiClient;
}

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY.length === 0) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    console.log('🔑 Initializing Anthropic client with key length:', env.ANTHROPIC_API_KEY.length);
    anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.length === 0) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calls Gemini API with a prompt and returns parsed JSON response
 */
async function callGemini(systemPrompt: string, userPrompt: string, maxTokens: number = 2000): Promise<any> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    });

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    console.log('[Gemini] Response length:', text.length);
    console.log('[Gemini] First 200 chars:', text.substring(0, 200));
    console.log('[Gemini] Last 200 chars:', text.substring(text.length - 200));

    // Try to parse JSON from the response
    // Gemini sometimes wraps JSON in markdown code blocks
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

    // Check if JSON looks truncated
    if (!jsonText.endsWith('}') && !jsonText.endsWith(']')) {
      console.error('[Gemini] Response appears truncated. Last 500 chars:', jsonText.substring(jsonText.length - 500));
      throw new Error('AI response was truncated. Try reducing the curriculum size or requesting fewer units.');
    }

    try {
      return JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('[Gemini] JSON parse failed. Response:', jsonText);
      throw new Error(`Invalid JSON from AI: ${parseError.message}`);
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);

    if (error.message?.includes('API key not valid')) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    }

    if (error.message?.includes('quota') || error.message?.includes('429')) {
      throw new Error('Gemini rate limit exceeded. Please try again later.');
    }

    throw new Error(`Failed to call Gemini: ${error.message}`);
  }
}

/**
 * Calls Claude API with a prompt and returns parsed JSON response
 */
async function callClaude(systemPrompt: string, userPrompt: string, maxTokens: number = 2000): Promise<any> {
  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
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
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
  const provider = env.AI_PROVIDER || 'gemini';

  if (provider === 'gemini') {
    return await callGemini(systemPrompt, userPrompt, maxTokens);
  } else if (provider === 'claude') {
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
    assignmentType?: 'PRACTICE' | 'TEST';
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
  const provider = env.AI_PROVIDER || 'gemini';

  if (provider === 'gemini') {
    return !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0);
  } else if (provider === 'claude') {
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
    const provider = env.AI_PROVIDER || 'gemini';

    if (provider === 'gemini') {
      const client = getGeminiClient();
      const model = client.getGenerativeModel({ model: env.GEMINI_MODEL || 'gemini-pro' });
      await model.generateContent('Test');
    } else if (provider === 'claude') {
      const client = getAnthropicClient();
      await client.messages.create({
        model: env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }],
      });
    } else if (provider === 'openai') {
      const client = getOpenAIClient();
      await client.chat.completions.create({
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

      const client = getAnthropicClient();
      const response = await client.messages.create({
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
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
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

  const provider = env.AI_PROVIDER || 'gemini';

  try {
    if (provider === 'gemini') {
      // Use Gemini streaming
      const client = getGeminiClient();
      const geminiModel = client.getGenerativeModel({
        model: model || env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
      });

      // Convert messages to Gemini format
      const systemMessage = messages.find((m) => m.role === 'system');
      const chatMessages = messages.filter((m) => m.role !== 'system');

      // Build the prompt with system message
      let fullPrompt = '';
      if (systemMessage) {
        fullPrompt = `${systemMessage.content}\n\n`;
      }

      // Add conversation history
      for (const msg of chatMessages) {
        fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
      }

      const result = await geminiModel.generateContentStream(fullPrompt);

      let fullResponse = '';
      let totalTokens = 0;

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          totalTokens += estimateTokens(text);
          callback.onToken(text);
        }
      }

      const promptTokens = estimateTokens(fullPrompt);
      const completionTokens = estimateTokens(fullResponse);

      callback.onComplete(fullResponse, {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      });
    } else if (provider === 'claude') {
      // Convert messages format for Claude
      const systemMessage = messages.find((m) => m.role === 'system');
      const userMessages = messages.filter((m) => m.role !== 'system');

      const claudeMessages = userMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const client = getAnthropicClient();
      const stream = await client.messages.stream({
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
      const client = getOpenAIClient();
      const stream = await client.chat.completions.create({
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

// ============================================================================
// CURRICULUM SCHEDULING - AI METHODS
// ============================================================================

/**
 * Analyzes curriculum content and generates a year-long schedule with units
 * @param curriculumText Extracted text from curriculum file
 * @param options Scheduling options including school year configuration
 * @returns AI-generated schedule with units, time estimates, difficulty levels
 */
export async function analyzeCurriculumForScheduling(
  curriculumText: string,
  options: {
    gradeLevel: string;
    subject: string;
    schoolYearStart: Date;
    schoolYearEnd: Date;
    totalWeeks: number;
    targetUnits?: number;
    pacingPreference?: 'standard' | 'accelerated' | 'extended';
  }
): Promise<AIScheduleGenerationResult> {
  const { gradeLevel, subject, totalWeeks, targetUnits, pacingPreference } = options;

  const systemPrompt = 'You are an expert curriculum designer who creates comprehensive year-long teaching schedules. You analyze educational content and structure it into logical teaching units with precise learning objectives and difficulty assessments.';

  const userPrompt = `Analyze this curriculum content and create a complete teaching schedule for ${gradeLevel} ${subject}.

**CURRICULUM CONTENT:**
${curriculumText}

**TASK:**
Break this curriculum into ${targetUnits || '6-12'} major teaching units that follow a logical progression. Each unit should represent a major instructional block. Within each unit, create sub-units (2-6 depending on content complexity) that represent specific topics or lessons to be taught sequentially.

**REQUIREMENTS:**
1. **Unit Structure**: Identify major units that build logically from foundational to advanced concepts
2. **Sub-Unit Structure**: For EACH unit, break it down into appropriate sub-units based on content. Each sub-unit should cover a specific concept or skill. The number of sub-units should match the complexity and breadth of the unit content (2-6 sub-units per unit).
3. **Difficulty Analysis**: Rate each unit 1-5:
   - 1 = Introductory (foundational concepts, minimal prerequisites)
   - 2 = Basic (building on foundations, moderate complexity)
   - 3 = Intermediate (requires prior knowledge, moderate challenge)
   - 4 = Advanced (complex concepts, significant prerequisites)
   - 5 = Expert (highest complexity, cumulative knowledge required)
4. **Learning Objectives**: Provide clear, measurable learning objectives for each sub-unit
5. **Concepts**: Identify key concepts and skills for each sub-unit
6. **Sequencing**: Note which topics are prerequisites and which topics each unit builds upon

**RESPONSE FORMAT (JSON):**
{
  "units": [
    {
      "title": "Unit 1: [Descriptive Title]",
      "description": "Clear 2-3 sentence description of what students will learn in this unit",
      "subUnits": [
        {
          "name": "Sub-unit Name",
          "description": "1-2 sentence description of this sub-unit",
          "concepts": ["concept1", "concept2", "concept3"],
          "learningObjectives": ["Students will be able to...", "Students will understand...", "Students will demonstrate..."],
          "estimatedHours": 3.5,
          "orderIndex": 1
        }
      ],
      "estimatedWeeks": 3,
      "estimatedHours": 15,
      "confidenceScore": 0.85,
      "difficultyLevel": 1,
      "difficultyReasoning": "Explanation of why this difficulty level was assigned (1-2 sentences)",
      "prerequisiteTopics": ["Topic from earlier unit if applicable"],
      "buildUponTopics": ["Topic this leads into"],
      "orderInSequence": 1,
      "suggestedAssessments": [
        {
          "type": "quiz",
          "timing": "end",
          "estimatedQuestions": 10
        }
      ]
    }
  ],
  "metadata": {
    "totalUnits": 8,
    "estimatedTotalWeeks": 32,
    "difficultyProgression": "stepped",
    "recommendedPacing": "standard",
    "gradeLevel": "${gradeLevel}",
    "subject": "${subject}"
  }
}

**IMPORTANT:**
- Units should build logically (easier → harder)
- Difficulty progression should feel natural
- Each unit should be substantial enough to warrant separate focus
- The number of sub-units should match content complexity (simple units may have 2-3, complex units may have 5-6)
- Provide comprehensive learning objectives that are specific and measurable
- Respond ONLY with valid JSON, no other text or markdown formatting

Generate the comprehensive curriculum schedule now:`;

  try {
    // Comprehensive output with variable sub-units (2-6 per unit)
    const result = await callAI(systemPrompt, userPrompt, 8000) as AIScheduleGenerationResult;

    // Validate the response
    if (!result.units || !Array.isArray(result.units) || result.units.length === 0) {
      throw new Error('AI did not generate any units');
    }

    if (!result.metadata) {
      throw new Error('AI did not generate metadata');
    }

    // Validate each unit has required fields
    for (const unit of result.units) {
      if (!unit.title || !unit.description || !unit.subUnits || unit.estimatedWeeks === undefined || unit.difficultyLevel === undefined) {
        throw new Error('AI generated incomplete unit structure');
      }
      if (!Array.isArray(unit.subUnits) || unit.subUnits.length === 0) {
        throw new Error(`Unit "${unit.title}" has no sub-units`);
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error analyzing curriculum for scheduling:', error);
    throw new Error(`Failed to generate curriculum schedule: ${error.message}`);
  }
}

/**
 * Refines an existing curriculum schedule based on teacher feedback
 * @param currentSchedule Current schedule units
 * @param teacherRequest Natural language request for changes
 * @param context Additional context about the class
 * @returns AI-generated refinement suggestions
 */
export async function refineScheduleWithAI(
  currentSchedule: {
    units: Array<{
      id: string;
      title: string;
      startDate: Date;
      endDate: Date;
      estimatedWeeks: number;
      difficultyLevel: number;
      topics: any;
    }>;
    schoolYearStart: Date;
    schoolYearEnd: Date;
    totalWeeks: number;
  },
  teacherRequest: string,
  context: {
    gradeLevel: string;
    subject: string;
  }
): Promise<AIScheduleRefinementResult> {
  const systemPrompt = 'You are a helpful curriculum planning assistant. You help teachers refine their year-long curriculum schedules based on their needs and constraints.';

  const scheduleDescription = currentSchedule.units
    .map((unit, index) => {
      const startDate = new Date(unit.startDate);
      const endDate = new Date(unit.endDate);
      return `${index + 1}. ${unit.title}\n   - Dates: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n   - Weeks: ${unit.estimatedWeeks}\n   - Difficulty: Level ${unit.difficultyLevel}/5\n   - Topics: ${Array.isArray(unit.topics) ? unit.topics.map((t: any) => t.name).join(', ') : 'N/A'}`;
    })
    .join('\n\n');

  const userPrompt = `I'm teaching ${context.subject} to ${context.gradeLevel} students and need help refining my curriculum schedule.

**CURRENT SCHEDULE:**
School Year: ${currentSchedule.schoolYearStart.toLocaleDateString()} to ${currentSchedule.schoolYearEnd.toLocaleDateString()} (${currentSchedule.totalWeeks} weeks)

${scheduleDescription}

**TEACHER REQUEST:**
"${teacherRequest}"

**TASK:**
Understand the teacher's request and suggest specific changes to the schedule. Provide:
1. A clear natural language response explaining your suggestions
2. Specific changes to make (which unit, what field, old value, new value, reasoning)

**RESPONSE FORMAT (JSON):**
{
  "response": "Clear, friendly explanation of your suggestions addressing the teacher's request",
  "suggestedChanges": [
    {
      "unitId": "unit-id-here",
      "unitTitle": "Unit Title",
      "field": "estimatedWeeks" | "startDate" | "endDate" | "difficultyLevel" | "orderInSequence",
      "currentValue": "current value",
      "suggestedValue": "new value",
      "reasoning": "Why this change makes sense"
    }
  ]
}

**EXAMPLES:**
- Request: "Make Unit 3 longer" → Suggest increasing estimatedWeeks from 2 to 3, adjust subsequent dates
- Request: "This seems too rushed" → Suggest extending several units, removing optional content
- Request: "Add more review time" → Suggest adding review units or extending existing units

Respond ONLY with valid JSON:`;

  try {
    const result = await callAI(systemPrompt, userPrompt, 2000) as AIScheduleRefinementResult;

    // Validate response
    if (!result.response || !result.suggestedChanges) {
      throw new Error('AI did not generate valid refinement suggestions');
    }

    return result;
  } catch (error: any) {
    console.error('Error refining schedule with AI:', error);
    throw new Error(`Failed to refine schedule: ${error.message}`);
  }
}

/**
 * Generates AI suggestions for improving a curriculum schedule
 * @param schedule Current schedule data
 * @param context Class context
 * @returns Proactive suggestions for improvements
 */
export async function getScheduleImprovementSuggestions(
  schedule: {
    units: Array<{
      title: string;
      estimatedWeeks: number;
      difficultyLevel: number;
      orderInSequence: number;
    }>;
    totalWeeks: number;
  },
  context: {
    gradeLevel: string;
    subject: string;
  }
): Promise<Array<{
  type: 'PACING' | 'DIFFICULTY' | 'SEQUENCING' | 'ASSESSMENT' | 'REVIEW';
  title: string;
  description: string;
  affectedUnits: string[];
  suggestedAction: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}>> {
  const systemPrompt = 'You are an expert curriculum designer who provides proactive suggestions to improve teaching schedules.';

  const scheduleOverview = schedule.units
    .map((unit, i) => `${i + 1}. ${unit.title} - ${unit.estimatedWeeks} weeks, Difficulty ${unit.difficultyLevel}/5`)
    .join('\n');

  const totalWeeksScheduled = schedule.units.reduce((sum, u) => sum + u.estimatedWeeks, 0);

  const userPrompt = `Analyze this curriculum schedule and suggest improvements:

**CONTEXT:**
- Grade: ${context.gradeLevel}
- Subject: ${context.subject}
- Total weeks available: ${schedule.totalWeeks}
- Total weeks scheduled: ${totalWeeksScheduled}

**SCHEDULE:**
${scheduleOverview}

**TASK:**
Identify potential improvements in these areas:
1. PACING - Units too rushed or too slow
2. DIFFICULTY - Difficulty progression issues
3. SEQUENCING - Better ordering of topics
4. ASSESSMENT - Missing assessment opportunities
5. REVIEW - Insufficient review/practice time

**RESPONSE FORMAT (JSON array):**
[
  {
    "type": "PACING",
    "title": "Brief title of suggestion",
    "description": "Detailed explanation of the issue and solution",
    "affectedUnits": ["Unit 1", "Unit 2"],
    "suggestedAction": "Specific action to take",
    "priority": "HIGH" | "MEDIUM" | "LOW"
  }
]

Only suggest improvements that would genuinely help. If the schedule looks good, return an empty array [].

Respond ONLY with valid JSON array:`;

  try {
    const result = await callAI(systemPrompt, userPrompt, 1500);

    if (!Array.isArray(result)) {
      return [];
    }

    return result;
  } catch (error: any) {
    console.error('Error getting schedule improvement suggestions:', error);
    return [];
  }
}

// ============================================================================
// LESSON RECORDING & TRANSCRIPTION
// ============================================================================

interface AILessonNotesResult {
  summary: string;
  keyConcepts: string[];
  actionItems: string[];
  homework: string | null;
  fullTranscript: string;
}

/**
 * Process audio recording and generate structured lesson notes
 * @param audioBuffer - Audio file buffer
 * @param lessonContext - Context about the lesson (class name, subject, grade level)
 * @returns Structured lesson notes with summary, key concepts, action items, and homework
 */
export async function generateLessonNotes(
  audioBuffer: Buffer,
  lessonContext: {
    className: string;
    subject: string;
    gradeLevel: string;
    lessonTitle?: string;
  }
): Promise<AILessonNotesResult> {
  const startTime = Date.now();

  try {
    console.log('🎤 Processing audio for lesson notes generation...');
    console.log('   Context:', lessonContext);

    // Step 1: Transcribe audio using Gemini
    const transcription = await transcribeAudio(audioBuffer);

    if (!transcription || transcription.length === 0) {
      throw new Error('Failed to transcribe audio - empty result');
    }

    console.log(`✅ Transcription complete (${transcription.length} chars)`);

    // Step 2: Generate structured notes from transcription
    const notes = await generateNotesFromTranscript(transcription, lessonContext);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Lesson notes generated in ${processingTime}ms`);

    return {
      ...notes,
      fullTranscript: transcription,
    };
  } catch (error: any) {
    console.error('❌ Error generating lesson notes:', error);
    throw new Error(`Failed to generate lesson notes: ${error.message}`);
  }
}

/**
 * Transcribe audio using Gemini's audio understanding capabilities
 */
async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: env.GEMINI_MODEL || 'gemini-2.0-flash-exp', // Supports audio input
    });

    // Convert audio buffer to base64
    const audioBase64 = audioBuffer.toString('base64');

    // Determine mime type based on audio format (default to webm)
    const mimeType = 'audio/webm';

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
      'Please provide a complete, accurate transcription of this audio recording. Include all spoken content, capturing the natural flow of the classroom discussion.',
    ]);

    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}

/**
 * Generate structured notes from transcription
 */
async function generateNotesFromTranscript(
  transcript: string,
  context: {
    className: string;
    subject: string;
    gradeLevel: string;
    lessonTitle?: string;
  }
): Promise<Omit<AILessonNotesResult, 'fullTranscript'>> {
  const systemPrompt = `You are an expert educational assistant helping teachers by analyzing classroom recordings and generating structured lesson notes.

Your task is to analyze the transcription of a class session and extract:
1. A concise summary of what was taught
2. Key concepts that were covered
3. Action items for the teacher (follow-ups, things to review, student questions to address)
4. Any homework assignments that were mentioned

Focus on pedagogically important content. Ignore administrative announcements unless they're action items.`;

  const userPrompt = `**CLASS CONTEXT:**
- Class: ${context.className}
- Subject: ${context.subject}
- Grade Level: ${context.gradeLevel}
${context.lessonTitle ? `- Lesson Title: ${context.lessonTitle}` : ''}

**TRANSCRIPTION:**
${transcript}

**INSTRUCTIONS:**
Analyze this class transcription and generate structured notes in the following JSON format:

{
  "summary": "A 2-3 sentence summary of what was taught in this lesson",
  "keyConcepts": ["concept 1", "concept 2", "concept 3"],
  "actionItems": ["action item 1", "action item 2"],
  "homework": "Description of homework assignment, or null if none mentioned"
}

**GUIDELINES:**
- Summary: Focus on the main teaching points and learning objectives
- Key Concepts: List 3-8 specific concepts, topics, or skills covered (e.g., "quadratic equations", "photosynthesis", "characterization in literature")
- Action Items: Things the teacher should follow up on (e.g., "Review Sarah's question about negative exponents", "Prepare additional practice problems for next class", "Grade lab reports by Friday")
- Homework: Only include if explicitly mentioned. Be specific about what students need to do.

Respond ONLY with valid JSON:`;

  try {
    const result = await callAI(systemPrompt, userPrompt, 1500);

    // Validate the result
    if (!result.summary || !Array.isArray(result.keyConcepts) || !Array.isArray(result.actionItems)) {
      throw new Error('Invalid response structure from AI');
    }

    return {
      summary: result.summary,
      keyConcepts: result.keyConcepts,
      actionItems: result.actionItems,
      homework: result.homework || null,
    };
  } catch (error: any) {
    console.error('Error generating notes from transcript:', error);
    throw new Error(`Failed to generate notes: ${error.message}`);
  }
}
