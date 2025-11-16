// ============================================================================
// VIEW SUBMISSIONS PAGE
// Teacher interface to view student submissions, answers, and manually grade
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Badge } from '../../components/common';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Edit3,
  Save,
  XCircle,
  User,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { assignmentService, StudentSubmission, Answer } from '../../services/assignment.service';

export const ViewSubmissions: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradingMode, setGradingMode] = useState<{ [answerId: string]: boolean }>({});
  const [manualGrades, setManualGrades] = useState<{ [answerId: string]: number }>({});
  const [teacherFeedback, setTeacherFeedback] = useState<{ [answerId: string]: string }>({});

  // Fetch assignment details
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentService.getAssignment(assignmentId!),
    enabled: !!assignmentId,
  });

  // Fetch all submissions for this assignment
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () =>
      assignmentService.getSubmissions({
        assignmentId: assignmentId!,
        includeAnswers: true,
      }),
    enabled: !!assignmentId,
  });

  const submissions = submissionsData?.data || [];

  // Find selected submission
  const selectedSubmission = submissions.find((s) => s.id === selectedSubmissionId);

  // Calculate stats
  const totalSubmissions = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'GRADED').length;
  const gradedSubmissions = submissions.filter((s) => s.status === 'GRADED').length;
  const inProgressSubmissions = submissions.filter((s) => s.status === 'IN_PROGRESS').length;
  const notStartedSubmissions = submissions.filter((s) => s.status === 'NOT_STARTED').length;

  const gradedScores = submissions
    .filter((s) => s.status === 'GRADED' && s.percentage !== null)
    .map((s) => s.percentage!);
  const averageScore = gradedScores.length
    ? Math.round(gradedScores.reduce((sum, score) => sum + score, 0) / gradedScores.length)
    : 0;

  // Override grade mutation
  const overrideGradeMutation = useMutation({
    mutationFn: async ({ answerId, points, feedback }: { answerId: string; points: number; feedback?: string }) => {
      if (!selectedSubmissionId) throw new Error('No submission selected');
      return assignmentService.overrideGrade(selectedSubmissionId, answerId, {
        pointsEarned: points,
        teacherFeedback: feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      setGradingMode({});
      setManualGrades({});
      setTeacherFeedback({});
    },
  });

  const handleSaveGrade = (answerId: string, pointsPossible: number) => {
    const points = manualGrades[answerId] ?? 0;
    const feedback = teacherFeedback[answerId] ?? '';

    // Validate points
    if (points < 0 || points > pointsPossible) {
      alert(`Points must be between 0 and ${pointsPossible}`);
      return;
    }

    overrideGradeMutation.mutate({ answerId, points, feedback });
  };

  const getStatusBadge = (status: StudentSubmission['status']) => {
    switch (status) {
      case 'GRADED':
        return <Badge variant="success" size="sm">Graded</Badge>;
      case 'SUBMITTED':
        return <Badge variant="primary" size="sm">Submitted</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning" size="sm">In Progress</Badge>;
      case 'NOT_STARTED':
        return <Badge variant="neutral" size="sm">Not Started</Badge>;
      default:
        return null;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoadingAssignment || isLoadingSubmissions) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading submissions...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Assignment not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/assignments')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">{assignment.title}</h1>
              <p className="text-slate-600 mt-1">
                {assignment.class?.name} • {assignment.type}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="glassElevated" padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{totalSubmissions}</div>
                  <div className="text-xs text-slate-600">Submitted</div>
                </div>
              </div>
            </Card>
            <Card variant="glassElevated" padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{gradedSubmissions}</div>
                  <div className="text-xs text-slate-600">Graded</div>
                </div>
              </div>
            </Card>
            <Card variant="glassElevated" padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{inProgressSubmissions}</div>
                  <div className="text-xs text-slate-600">In Progress</div>
                </div>
              </div>
            </Card>
            <Card variant="glassElevated" padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {averageScore > 0 ? `${averageScore}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-600">Average Score</div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List - Left Column */}
          <div className="lg:col-span-1">
            <Card variant="glassElevated">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Student Submissions</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No submissions yet</p>
                  </div>
                ) : (
                  submissions.map((submission) => (
                    <motion.button
                      key={submission.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedSubmissionId(submission.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSubmissionId === submission.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            Student {submission.studentId.slice(0, 8)}
                          </span>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                      {(submission.status === 'SUBMITTED' || submission.status === 'GRADED') && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            {submission.earnedPoints ?? 0}/{submission.possiblePoints ?? assignment.totalPoints} pts
                          </span>
                          {submission.percentage !== null && submission.percentage !== undefined && (
                            <span className={`font-bold ${getScoreColor(submission.percentage)}`}>
                              {submission.percentage}%
                            </span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Submission Details - Right Column */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedSubmission ? (
                <motion.div
                  key={selectedSubmission.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Submission Header */}
                  <Card variant="glassElevated">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          Student {selectedSubmission.studentId.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-slate-600">
                          Submitted {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        {selectedSubmission.percentage !== null && selectedSubmission.percentage !== undefined && (
                          <div className={`text-3xl font-bold ${getScoreColor(selectedSubmission.percentage)}`}>
                            {selectedSubmission.percentage}%
                          </div>
                        )}
                        <div className="text-sm text-slate-600">
                          {selectedSubmission.earnedPoints ?? 0}/{selectedSubmission.possiblePoints ?? assignment.totalPoints} points
                        </div>
                      </div>
                    </div>
                    {selectedSubmission.status === 'SUBMITTED' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          This submission has been auto-graded. You can override any answer grades below.
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Answers */}
                  {selectedSubmission.answers && selectedSubmission.answers.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSubmission.answers.map((answer, index) => {
                        const question = answer.question;
                        const isInGradingMode = gradingMode[answer.id] || false;
                        const currentGrade = manualGrades[answer.id] ?? answer.pointsEarned ?? 0;
                        const currentFeedback = teacherFeedback[answer.id] ?? answer.teacherFeedback ?? '';

                        return (
                          <Card variant="glass" key={answer.id}>
                            <div className="space-y-3">
                              {/* Question */}
                              <div>
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-bold text-slate-900">
                                    Question {index + 1}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    {answer.isCorrect !== null && (
                                      answer.isCorrect ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                      )
                                    )}
                                    <Badge variant={answer.teacherOverride ? 'warning' : 'neutral'} size="sm">
                                      {answer.teacherOverride ? 'Manually Graded' : answer.aiGraded ? 'AI Graded' : 'Not Graded'}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-slate-700">{question?.questionText}</p>
                              </div>

                              {/* Student's Answer */}
                              <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                                  Student's Answer
                                </p>
                                <p className="text-slate-900">
                                  {question?.type === 'MULTIPLE_CHOICE'
                                    ? `Option ${answer.selectedOption}`
                                    : answer.answerText || 'No answer provided'}
                                </p>
                              </div>

                              {/* Correct Answer (if applicable) */}
                              {question?.type === 'MULTIPLE_CHOICE' && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                                    Correct Answer
                                  </p>
                                  <p className="text-green-900">Option {question.correctOption}</p>
                                </div>
                              )}

                              {/* AI Feedback (if available) */}
                              {answer.aiFeedback && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                                    AI Feedback
                                  </p>
                                  <p className="text-blue-900 text-sm">{answer.aiFeedback}</p>
                                  {answer.aiConfidence && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Confidence: {Math.round(answer.aiConfidence * 100)}%
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Teacher Feedback */}
                              {!isInGradingMode && answer.teacherFeedback && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                                    Teacher Feedback
                                  </p>
                                  <p className="text-purple-900 text-sm">{answer.teacherFeedback}</p>
                                </div>
                              )}

                              {/* Grading Section */}
                              <div className="pt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-600">Points:</span>
                                    {isInGradingMode ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max={question?.points || 0}
                                        value={currentGrade}
                                        onChange={(e) =>
                                          setManualGrades({
                                            ...manualGrades,
                                            [answer.id]: parseFloat(e.target.value),
                                          })
                                        }
                                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                                      />
                                    ) : (
                                      <span
                                        className={`font-bold ${
                                          (answer.pointsEarned ?? 0) >= (question?.points || 0) * 0.9
                                            ? 'text-green-600'
                                            : (answer.pointsEarned ?? 0) >= (question?.points || 0) * 0.7
                                            ? 'text-orange-600'
                                            : 'text-red-600'
                                        }`}
                                      >
                                        {answer.pointsEarned ?? 0}
                                      </span>
                                    )}
                                    <span className="text-sm text-slate-600">/ {question?.points || 0}</span>
                                  </div>

                                  {isInGradingMode ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setGradingMode({ ...gradingMode, [answer.id]: false });
                                          setManualGrades({ ...manualGrades, [answer.id]: answer.pointsEarned ?? 0 });
                                          setTeacherFeedback({ ...teacherFeedback, [answer.id]: answer.teacherFeedback ?? '' });
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="gradient"
                                        size="sm"
                                        onClick={() => handleSaveGrade(answer.id, question?.points || 0)}
                                        disabled={overrideGradeMutation.isPending}
                                      >
                                        <Save className="w-4 h-4 mr-2" />
                                        {overrideGradeMutation.isPending ? 'Saving...' : 'Save Grade'}
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="glass"
                                      size="sm"
                                      glow={false}
                                      onClick={() => {
                                        setGradingMode({ ...gradingMode, [answer.id]: true });
                                        setManualGrades({ ...manualGrades, [answer.id]: answer.pointsEarned ?? 0 });
                                        setTeacherFeedback({ ...teacherFeedback, [answer.id]: answer.teacherFeedback ?? '' });
                                      }}
                                    >
                                      <Edit3 className="w-4 h-4 mr-2" />
                                      Override Grade
                                    </Button>
                                  )}
                                </div>

                                {/* Teacher Feedback Input */}
                                {isInGradingMode && (
                                  <div className="mt-3">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                                      Teacher Feedback (Optional)
                                    </label>
                                    <textarea
                                      value={currentFeedback}
                                      onChange={(e) =>
                                        setTeacherFeedback({
                                          ...teacherFeedback,
                                          [answer.id]: e.target.value,
                                        })
                                      }
                                      placeholder="Add feedback for the student..."
                                      rows={2}
                                      className="w-full px-3 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card variant="glassElevated">
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No answers submitted yet</p>
                      </div>
                    </Card>
                  )}
                </motion.div>
              ) : (
                <Card variant="glassElevated">
                  <div className="text-center py-12 text-slate-500">
                    <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">Select a student submission</p>
                    <p className="text-sm mt-1">Choose a student from the list to view their answers</p>
                  </div>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
