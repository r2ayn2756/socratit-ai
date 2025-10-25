// ============================================================================
// STUDENT ANALYTICS PAGE - BATCH 7
// Student-focused analytics dashboard showing personal performance insights
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

// Components
import { PerformanceTimelineChart } from '../../components/analytics/PerformanceTimelineChart';
import { ConceptComparisonChart } from '../../components/analytics/ConceptComparisonChart';
import { AssignmentBreakdownChart } from '../../components/analytics/AssignmentBreakdownChart';
import { RecommendationsPanel } from '../../components/analytics/RecommendationsPanel';
import { ExportButton } from '../../components/analytics/ExportButton';

// Services
import {
  getStudentInsights,
  getStudentConceptMastery,
  getPerformanceTimeline,
  getConceptComparison,
  getAssignmentBreakdown,
  generateRecommendations,
  trackEvent,
} from '../../services/analytics.service';

// Types
import {
  StudentInsight,
  ConceptMastery,
  TimelineDataPoint,
  ConceptComparison,
  AssignmentTypeBreakdown,
  RecommendationData,
} from '../../types/analytics.types';

// Icons
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  Target,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const StudentAnalytics: React.FC = () => {
  // State
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [timeGranularity, setTimeGranularity] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [conceptMastery, setConceptMastery] = useState<ConceptMastery[]>([]);
  const [performanceTimeline, setPerformanceTimeline] = useState<TimelineDataPoint[]>([]);
  const [conceptComparison, setConceptComparison] = useState<ConceptComparison[]>([]);
  const [assignmentBreakdown, setAssignmentBreakdown] = useState<AssignmentTypeBreakdown[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);

  // Mock student ID (would come from auth context in real app)
  const studentId = 'student-123';

  // Mock classes
  const mockClasses = [
    { id: 'class-1', name: 'Algebra II' },
    { id: 'class-2', name: 'English Literature' },
    { id: 'class-3', name: 'World History' },
  ];

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!selectedClassId) {
      setError('Please select a class to view your analytics');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Track page view
      await trackEvent('student_analytics_view', { studentId, classId: selectedClassId });

      // Fetch all analytics data
      const [
        insightsData,
        conceptsData,
        timelineData,
        comparisonData,
        breakdownData,
      ] = await Promise.all([
        getStudentInsights(studentId, selectedClassId),
        getStudentConceptMastery(studentId, selectedClassId),
        getPerformanceTimeline(studentId, selectedClassId, undefined, undefined, timeGranularity),
        getConceptComparison(studentId, selectedClassId),
        getAssignmentBreakdown(studentId, selectedClassId),
      ]);

      setInsights(insightsData);
      setConceptMastery(conceptsData);
      setPerformanceTimeline(timelineData);
      setConceptComparison(comparisonData);
      setAssignmentBreakdown(breakdownData);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load your analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Generate recommendations
  const handleGenerateRecommendations = async (focus?: 'concepts' | 'assignments' | 'engagement' | 'overall') => {
    if (!selectedClassId) return;

    try {
      setLoadingRecommendations(true);
      await trackEvent('student_generate_recommendations', { studentId, classId: selectedClassId, focus });
      const data = await generateRecommendations(studentId, selectedClassId, focus);
      setRecommendations(data);
    } catch (err: any) {
      console.error('Failed to generate recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Handle granularity change
  const handleGranularityChange = async (granularity: 'day' | 'week' | 'month') => {
    setTimeGranularity(granularity);
    if (selectedClassId) {
      const data = await getPerformanceTimeline(studentId, selectedClassId, undefined, undefined, granularity);
      setPerformanceTimeline(data);
    }
  };

  // Effects
  useEffect(() => {
    if (selectedClassId) {
      fetchAnalytics();
    }
  }, [selectedClassId]);

  // Calculate overall stats from insights
  const overallStats = insights.length > 0 ? {
    avgGrade: insights[0]?.performanceMetrics?.overallGrade || 0,
    completionRate: insights[0]?.performanceMetrics?.completionRate || 0,
    rank: insights[0]?.performanceMetrics?.classRank || 0,
    totalStudents: 30, // Mock value
    streakDays: insights[0]?.performanceMetrics?.avgStreakDays || 0,
    timeSpent: insights[0]?.performanceMetrics?.totalTimeSpent || 0,
  } : null;

  return (
    <DashboardLayout userRole="student">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Analytics</h1>
            <p className="text-slate-600 mt-1">
              Track your progress and get personalized insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Class Filter */}
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(e.target.value || null)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white text-slate-900"
            >
              <option value="">Select a class</option>
              {mockClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            {/* Export Button */}
            {selectedClassId && (
              <ExportButton
                type="student"
                studentId={studentId}
                classId={selectedClassId}
                format="json"
                label="Export My Report"
              />
            )}
          </div>
        </motion.div>

        {/* Content */}
        {!selectedClassId ? (
          <motion.div variants={fadeInUp}>
            <Card>
              <div className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Select a Class
                </h3>
                <p className="text-slate-600">
                  Choose a class from the dropdown above to view your performance analytics
                </p>
              </div>
            </Card>
          </motion.div>
        ) : loading ? (
          <motion.div variants={fadeInUp}>
            <Card>
              <div className="p-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 mx-auto mb-4"
                >
                  <RefreshCw className="w-12 h-12 text-brand-blue" />
                </motion.div>
                <p className="text-slate-600">Loading your analytics...</p>
              </div>
            </Card>
          </motion.div>
        ) : error ? (
          <motion.div variants={fadeInUp}>
            <Card>
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Error Loading Analytics
                </h3>
                <p className="text-slate-600 mb-4">{error}</p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Overview Stats */}
            {overallStats && (
              <motion.div variants={fadeInUp}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Overall Grade */}
                  <Card>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Overall Grade</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {overallStats.avgGrade.toFixed(1)}%
                        </p>
                        <div className="flex items-center gap-1 text-sm mt-2 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>On track</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Award className="w-6 h-6" />
                      </div>
                    </div>
                  </Card>

                  {/* Class Rank */}
                  <Card>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Class Rank</p>
                        <p className="text-3xl font-bold text-slate-900">
                          #{overallStats.rank}
                        </p>
                        <p className="text-sm text-slate-600 mt-2">
                          of {overallStats.totalStudents} students
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-purple to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                        <Target className="w-6 h-6" />
                      </div>
                    </div>
                  </Card>

                  {/* Completion Rate */}
                  <Card>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Completion Rate</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {overallStats.completionRate.toFixed(0)}%
                        </p>
                        <div className="w-full h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                            style={{ width: `${overallStats.completionRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    </div>
                  </Card>

                  {/* Streak */}
                  <Card>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Study Streak</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {overallStats.streakDays} days
                        </p>
                        <div className="flex items-center gap-1 text-sm mt-2 text-orange-600">
                          <Calendar className="w-4 h-4" />
                          <span>Keep it up!</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Charts */}
              <div className="lg:col-span-2 space-y-6">
                {/* Performance Timeline */}
                {performanceTimeline.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <PerformanceTimelineChart
                      data={performanceTimeline}
                      title="My Performance Over Time"
                      granularity={timeGranularity}
                      onGranularityChange={handleGranularityChange}
                    />
                  </motion.div>
                )}

                {/* Assignment Breakdown */}
                {assignmentBreakdown.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <AssignmentBreakdownChart
                      data={assignmentBreakdown}
                      title="My Performance by Assignment Type"
                    />
                  </motion.div>
                )}

                {/* Concept Comparison */}
                {conceptComparison.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <ConceptComparisonChart
                      data={conceptComparison}
                      title="How I Compare to Class Average"
                      studentName="You"
                    />
                  </motion.div>
                )}
              </div>

              {/* Right Column - Recommendations & Insights */}
              <div className="space-y-6">
                {/* AI Recommendations */}
                <motion.div variants={fadeInUp}>
                  <RecommendationsPanel
                    data={recommendations}
                    loading={loadingRecommendations}
                    studentName="You"
                    onRefresh={handleGenerateRecommendations}
                  />
                </motion.div>

                {/* Quick Insights */}
                {insights.length > 0 && insights[0]?.insights && (
                  <motion.div variants={fadeInUp}>
                    <Card variant="elevated">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">Quick Insights</h3>
                            <p className="text-sm text-slate-600">Performance indicators</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {insights[0].insights.isStruggling && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-red-900">Needs Attention</p>
                                  <p className="text-xs text-red-700 mt-1">
                                    Your performance is below expectations. Consider reviewing recent material.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {insights[0].insights.hasMissedAssignments && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-orange-900">Missing Assignments</p>
                                  <p className="text-xs text-orange-700 mt-1">
                                    You have incomplete assignments. Complete them to improve your grade.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {insights[0].insights.hasDecliningGrade && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <TrendingDown className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-yellow-900">Grade Declining</p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    Your grades are trending downward. Reach out to your teacher for help.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {insights[0].insights.hasConceptGaps && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-blue-900">Concept Gaps Detected</p>
                                  <p className="text-xs text-blue-700 mt-1">
                                    Some concepts need more practice. Review the concepts below.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {!insights[0].insights.isStruggling &&
                           !insights[0].insights.hasMissedAssignments &&
                           !insights[0].insights.hasDecliningGrade && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Award className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-green-900">Great Work!</p>
                                  <p className="text-xs text-green-700 mt-1">
                                    You're doing well! Keep up the excellent work.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
