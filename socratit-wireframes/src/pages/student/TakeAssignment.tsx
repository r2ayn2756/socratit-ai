// ============================================================================
// TAKE ASSIGNMENT PAGE
// Student interface for completing assignments and answering questions
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/common';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
} from 'lucide-react';
import { assignmentService } from '../../services/assignment.service';
import { AlwaysVisibleAIChat } from '../../components/ai/AlwaysVisibleAIChat';

export const TakeAssignment: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch assignment details
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentService.getAssignment(assignmentId!),
    enabled: !!assignmentId,
  });

  // Start assignment (creates submission)
  const startMutation = useMutation({
    mutationFn: () => assignmentService.startAssignment(assignmentId!),
    onSuccess: (submission) => {
      setSubmissionId(submission.id);
    },
  });

  // Submit individual answer
  const answerMutation = useMutation({
    mutationFn: ({
      questionId,
      answer,
    }: {
      questionId: string;
      answer: string;
    }) => {
      if (!submissionId) throw new Error('No submission started');

      const question = assignment?.questions?.find((q) => q.id === questionId);
      if (!question) throw new Error('Question not found');

      if (question.type === 'MULTIPLE_CHOICE') {
        return assignmentService.submitAnswer(submissionId, {
          questionId,
          selectedOption: answer as 'A' | 'B' | 'C' | 'D',
        });
      } else {
        return assignmentService.submitAnswer(submissionId, {
          questionId,
          answerText: answer,
        });
      }
    },
    onSuccess: (data, variables) => {
      console.log('Answer submitted:', data);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    },
    onError: () => {
      setAutoSaveStatus('idle');
    },
  });

  // Submit entire assignment
  const submitMutation = useMutation({
    mutationFn: () => {
      if (!submissionId) throw new Error('No submission started');
      return assignmentService.submitAssignment(submissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      navigate('/student/assignments');
    },
  });

  // Start assignment on first load
  useEffect(() => {
    if (assignment && !submissionId && !startMutation.isPending) {
      startMutation.mutate();
    }
  }, [assignment, submissionId]);

  // Auto-save functionality - debounced save 2 seconds after typing stops
  useEffect(() => {
    const currentQuestion = assignment?.questions?.[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion?.id || ''];

    if (currentAnswer && submissionId && currentQuestion) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set status to saving
      setAutoSaveStatus('saving');

      // Set new timer for 2 seconds
      autoSaveTimerRef.current = setTimeout(() => {
        answerMutation.mutate({
          questionId: currentQuestion.id,
          answer: currentAnswer,
        });
      }, 2000);
    }

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [answers, currentQuestionIndex, submissionId, assignment]);

  if (assignmentLoading) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading assignment...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment || !assignment.questions || assignment.questions.length === 0) {
    return (
      <DashboardLayout userRole="student">
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Assignment Not Found
            </h2>
            <p className="text-slate-600 mb-4">
              This assignment doesn't exist or has no questions.
            </p>
            <Button onClick={() => navigate('/student/assignments')}>
              Back to Assignments
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const currentQuestion = assignment.questions[currentQuestionIndex];
  const totalQuestions = assignment.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const currentAnswer = answers[currentQuestion.id] || '';

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    // Submit current answer
    if (currentAnswer) {
      answerMutation.mutate({
        questionId: currentQuestion.id,
        answer: currentAnswer,
      });
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAssignment = () => {
    if (window.confirm('Are you sure you want to submit this assignment? You cannot change your answers after submission.')) {
      // Submit last answer if not submitted
      if (currentAnswer && !answerMutation.isPending) {
        answerMutation.mutate({
          questionId: currentQuestion.id,
          answer: currentAnswer,
        });
      }

      // Submit assignment
      submitMutation.mutate();
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <DashboardLayout userRole="student">
      {/* Always-visible AI Chat (right sidebar) */}
      <AlwaysVisibleAIChat
        assignmentId={assignmentId!}
        assignmentTitle={assignment.title}
        currentQuestionId={currentQuestion?.id}
        currentQuestionText={currentQuestion?.questionText}
      />

      {/* Main content area (with margin for chat) */}
      <div className="max-w-4xl mx-auto space-y-6 mr-96 pr-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/assignments')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {assignment.title}
              </h1>
              <p className="text-slate-600 mt-1">
                {assignment.class?.name} • {assignment.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <AnimatePresence>
              {autoSaveStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-sm"
                >
                  {autoSaveStatus === 'saving' && (
                    <>
                      <Save className="w-4 h-4 text-slate-400 animate-pulse" />
                      <span className="text-slate-600">Saving...</span>
                    </>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Saved</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <Badge variant="primary" size="lg">
              {assignment.totalPoints} points
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm text-slate-600">{progress}% Complete</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </Card>

        {/* Question Card */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Question {currentQuestionIndex + 1}
                </h2>
                <Badge variant="neutral" size="sm">
                  {currentQuestion.points} points
                </Badge>
              </div>
              <p className="text-lg text-slate-700 whitespace-pre-wrap">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Answer Input */}
            <div className="space-y-3">
              {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
                // Multiple Choice Options
                <>
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const optionText = (currentQuestion as any)[`option${option}`];
                    if (!optionText) return null;

                    return (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          currentAnswer === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={currentAnswer === option}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="flex-1 text-slate-700">
                          <span className="font-semibold mr-2">{option}.</span>
                          {optionText}
                        </span>
                      </label>
                    );
                  })}
                </>
              ) : (
                // Free Response
                <textarea
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {!isLastQuestion ? (
                <Button variant="primary" onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmitAssignment}
                  disabled={submitMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Question Navigator */}
        <Card>
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Question Navigator
          </h3>
          <div className="flex flex-wrap gap-2">
            {assignment.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[q.id]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
