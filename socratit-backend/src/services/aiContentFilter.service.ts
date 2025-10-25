/**
 * AI CONTENT FILTER SERVICE
 * Academic integrity enforcement and content moderation
 * Detects cheating attempts, inappropriate content, and safety issues
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

export interface FilterResult {
  allowed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  flagForReview?: boolean;
  suggestedResponse?: string;
}

export interface CheatingPattern {
  detected: boolean;
  pattern: string;
  confidence: number; // 0-1
  recommendAction: 'warn' | 'block' | 'alert_teacher';
}

export class AIContentFilterService {
  // Patterns that indicate student wants direct answers
  private directAnswerPatterns = [
    /give\s+me\s+the\s+answer/i,
    /what\s+is\s+the\s+answer/i,
    /tell\s+me\s+the\s+answer/i,
    /just\s+give\s+me/i,
    /solve\s+this\s+for\s+me/i,
    /do\s+this\s+for\s+me/i,
    /complete\s+this\s+for\s+me/i,
    /finish\s+this\s+for\s+me/i,
    /what\s+should\s+I\s+write/i,
    /write\s+this\s+for\s+me/i,
  ];

  // Patterns for copy-paste detection
  private copyPastePatterns = [
    /^question\s+\d+:/i,
    /^problem\s+\d+:/i,
    /^assignment\s+question/i,
    /select\s+the\s+correct\s+answer/i,
    /choose\s+all\s+that\s+apply/i,
  ];

  // Inappropriate content patterns
  private inappropriatePatterns = [
    /\b(fuck|shit|damn|hell|ass|bitch)\b/i,
    // Add more as needed, be careful with false positives
  ];

  /**
   * Filter student input message
   */
  async filterStudentMessage(
    content: string,
    studentId: string,
    conversationId?: string
  ): Promise<FilterResult> {
    // Check for direct answer requests
    const directAnswerCheck = this.detectDirectAnswerRequest(content);
    if (directAnswerCheck.detected) {
      return {
        allowed: true, // Still allow, but AI will handle it appropriately
        reason: 'Student asking for direct answer',
        severity: 'low',
        flagForReview: false,
        suggestedResponse:
          "I can see you're looking for an answer, but my goal is to help you learn! Let's work through this together. What have you tried so far?",
      };
    }

    // Check for copy-pasted assignment questions
    const copyPasteCheck = this.detectCopyPaste(content);
    if (copyPasteCheck) {
      return {
        allowed: true,
        reason: 'Possible assignment question copy-paste',
        severity: 'low',
        flagForReview: false,
      };
    }

    // Check for inappropriate content
    const inappropriateCheck = this.detectInappropriateContent(content);
    if (inappropriateCheck.detected) {
      return {
        allowed: false,
        reason: 'Inappropriate language detected',
        severity: 'high',
        flagForReview: true,
      };
    }

    // Check for suspicious patterns if we have conversation context
    if (conversationId) {
      const suspiciousCheck = await this.detectSuspiciousActivity(
        studentId,
        conversationId
      );
      if (suspiciousCheck.detected) {
        return {
          allowed: true,
          reason: suspiciousCheck.pattern,
          severity: 'medium',
          flagForReview: true,
        };
      }
    }

    return {
      allowed: true,
    };
  }

  /**
   * Filter AI response before sending to student
   */
  async filterAIResponse(
    content: string,
    assignmentId?: string
  ): Promise<FilterResult> {
    // Check if AI accidentally gave direct answer
    const directAnswerCheck = this.detectDirectAnswerGiven(content, assignmentId);
    if (directAnswerCheck) {
      return {
        allowed: false,
        reason: 'AI response contains direct answer',
        severity: 'critical',
        flagForReview: true,
        suggestedResponse:
          "I apologize, but I should guide you to the answer rather than give it directly. Let me help you think through this step by step...",
      };
    }

    // Check for inappropriate content in AI response (rare but possible)
    const inappropriateCheck = this.detectInappropriateContent(content);
    if (inappropriateCheck.detected) {
      return {
        allowed: false,
        reason: 'Inappropriate content in AI response',
        severity: 'critical',
        flagForReview: true,
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Detect if student is asking for direct answer
   */
  private detectDirectAnswerRequest(content: string): {
    detected: boolean;
    confidence: number;
  } {
    let matchCount = 0;
    for (const pattern of this.directAnswerPatterns) {
      if (pattern.test(content)) {
        matchCount++;
      }
    }

    const detected = matchCount > 0;
    const confidence = Math.min(matchCount * 0.3, 1.0);

    return { detected, confidence };
  }

  /**
   * Detect copy-pasted assignment questions
   */
  private detectCopyPaste(content: string): boolean {
    for (const pattern of this.copyPastePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check if message is very long (possible copy-paste)
    if (content.length > 500) {
      return true;
    }

    return false;
  }

  /**
   * Detect inappropriate content
   */
  private detectInappropriateContent(content: string): {
    detected: boolean;
    words: string[];
  } {
    const foundWords: string[] = [];

    for (const pattern of this.inappropriatePatterns) {
      const match = content.match(pattern);
      if (match) {
        foundWords.push(match[0]);
      }
    }

    return {
      detected: foundWords.length > 0,
      words: foundWords,
    };
  }

  /**
   * Detect if AI gave direct answer (basic check)
   */
  private detectDirectAnswerGiven(
    content: string,
    assignmentId?: string
  ): boolean {
    // Look for patterns like "the answer is X" or "the correct answer is X"
    const directAnswerPhrases = [
      /the\s+answer\s+is\s+[A-D]/i,
      /the\s+correct\s+answer\s+is/i,
      /select\s+option\s+[A-D]/i,
      /choose\s+[A-D]/i,
    ];

    for (const pattern of directAnswerPhrases) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(
    studentId: string,
    conversationId: string
  ): Promise<CheatingPattern> {
    // Get recent messages in this conversation
    const recentMessages = await prisma.aIMessage.findMany({
      where: {
        conversationId,
        role: 'USER',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Check for rapid-fire questions (possible quiz cheating)
    const rapidQuestions = this.detectRapidQuestions(recentMessages);
    if (rapidQuestions.detected) {
      return rapidQuestions;
    }

    // Check for same question repeated multiple times
    const repeatedQuestions = this.detectRepeatedQuestions(recentMessages);
    if (repeatedQuestions.detected) {
      return repeatedQuestions;
    }

    return {
      detected: false,
      pattern: '',
      confidence: 0,
      recommendAction: 'warn',
    };
  }

  /**
   * Detect rapid-fire questions (possible quiz cheating)
   */
  private detectRapidQuestions(messages: any[]): CheatingPattern {
    if (messages.length < 5) {
      return { detected: false, pattern: '', confidence: 0, recommendAction: 'warn' };
    }

    // Check if 5+ messages sent within 2 minutes
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    const recentCount = messages.filter(
      (m) => m.createdAt >= twoMinutesAgo
    ).length;

    if (recentCount >= 5) {
      return {
        detected: true,
        pattern: 'Rapid-fire questions (5+ in 2 minutes)',
        confidence: 0.7,
        recommendAction: 'alert_teacher',
      };
    }

    return { detected: false, pattern: '', confidence: 0, recommendAction: 'warn' };
  }

  /**
   * Detect repeated identical questions
   */
  private detectRepeatedQuestions(messages: any[]): CheatingPattern {
    const questionTexts = messages.map((m) => m.content.toLowerCase().trim());
    const uniqueQuestions = new Set(questionTexts);

    if (questionTexts.length - uniqueQuestions.size >= 3) {
      return {
        detected: true,
        pattern: 'Same question repeated 3+ times',
        confidence: 0.8,
        recommendAction: 'alert_teacher',
      };
    }

    return { detected: false, pattern: '', confidence: 0, recommendAction: 'warn' };
  }

  /**
   * Check if student is struggling (needs teacher intervention)
   */
  async detectStrugglingPattern(
    studentId: string,
    conversationId: string
  ): Promise<{
    isStruggling: boolean;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    // Get messages in this conversation
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Check if conversation is very long (20+ messages)
    if (messages.length >= 20) {
      return {
        isStruggling: true,
        reason: 'Extended conversation (20+ messages) - may need teacher help',
        severity: 'medium',
      };
    }

    // Check for "I don't understand" patterns
    const confusionPatterns = [
      /i\s+don'?t\s+understand/i,
      /i'?m\s+confused/i,
      /this\s+doesn'?t\s+make\s+sense/i,
      /i'?m\s+lost/i,
      /i\s+still\s+don'?t\s+get\s+it/i,
    ];

    let confusionCount = 0;
    for (const message of messages.filter((m) => m.role === 'USER')) {
      for (const pattern of confusionPatterns) {
        if (pattern.test(message.content)) {
          confusionCount++;
          break;
        }
      }
    }

    if (confusionCount >= 3) {
      return {
        isStruggling: true,
        reason: 'Student expressed confusion 3+ times',
        severity: 'high',
      };
    }

    // Check if AI hasn't been helpful (based on feedback)
    const unhelpfulCount = messages.filter(
      (m) => m.role === 'ASSISTANT' && m.wasHelpful === false
    ).length;

    if (unhelpfulCount >= 3) {
      return {
        isStruggling: true,
        reason: 'Student marked 3+ responses as unhelpful',
        severity: 'high',
      };
    }

    return {
      isStruggling: false,
      reason: '',
      severity: 'low',
    };
  }

  /**
   * Flag message for teacher review
   */
  async flagMessageForReview(
    messageId: string,
    reason: string
  ): Promise<void> {
    await prisma.aIMessage.update({
      where: { id: messageId },
      data: {
        flaggedContent: true,
        flagReason: reason,
      },
    });
  }
}

export default new AIContentFilterService();
