// ============================================================================
// CLASS ANALYTICS SECTION
// Comprehensive analytics showing student performance and AI insights
// Replaces the old ClassOverview with integrated analytics and AI data
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  AlertTriangle,
  Brain,
  MessageSquare,
  Eye,
  BarChart3,
  Lightbulb,
  CheckCircle,
  Target,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { ClassOverview } from '../analytics/ClassOverview';
import { StrugglingStudents } from '../analytics/StrugglingStudents';
import { EngagementMetricsDisplay } from '../analytics/EngagementMetricsDisplay';
import { getClassOverview, getStrugglingStudents, getEngagementMetrics } from '../../services/analytics.service';
import { aiTAService } from '../../services/aiTA.service';
import { StudentConversationViewer } from '../ai/StudentConversationViewer';

interface ClassAnalyticsSectionProps {
  classId: string;
  onContactStudent?: (studentId: string) => void;
}

export const ClassAnalyticsSection: React.FC<ClassAnalyticsSectionProps> = ({
  classId,
  onContactStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-insights'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [showConversationViewer, setShowConversationViewer] = useState(false);
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('30');

  // Calculate date range for AI insights
  const getDateRange = () => {
    const now = new Date();
    const periodEnd = now.toISOString();
    let periodStart: string | undefined;

    if (timeRange === '7') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodStart = sevenDaysAgo.toISOString();
    } else if (timeRange === '30') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      periodStart = thirtyDaysAgo.toISOString();
    }

    return { periodStart, periodEnd };
  };

  const { periodStart, periodEnd } = getDateRange();

  // Fetch performance analytics data with error handling
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['class-overview', classId],
    queryFn: async () => {
      try {
        return await getClassOverview(classId);
      } catch (error) {
        console.warn('Analytics overview not available:', error);
        return undefined;
      }
    },
    retry: false,
    enabled: !!classId,
  });

  const { data: strugglingStudents = [], isLoading: strugglingLoading, error: strugglingError } = useQuery({
    queryKey: ['struggling-students', classId],
    queryFn: async () => {
      try {
        return await getStrugglingStudents(classId);
      } catch (error) {
        console.warn('Struggling students data not available:', error);
        return [];
      }
    },
    retry: false,
    enabled: !!classId,
  });

  const { data: engagementMetrics, isLoading: engagementLoading, error: engagementError } = useQuery({
    queryKey: ['engagement-metrics', classId],
    queryFn: async () => {
      try {
        return await getEngagementMetrics(classId);
      } catch (error) {
        console.warn('Engagement metrics not available:', error);
        return undefined;
      }
    },
    retry: false,
    enabled: !!classId,
  });

  // Fetch AI insights data with error handling
  const { data: aiInsights, isLoading: aiInsightsLoading } = useQuery({
    queryKey: ['ai-insights', classId, periodStart, periodEnd],
    queryFn: async () => {
      try {
        return await aiTAService.getClassInsights(classId, periodStart, periodEnd);
      } catch (error) {
        console.warn('AI insights not available:', error);
        return undefined;
      }
    },
    retry: false,
    enabled: !!classId && activeTab === 'ai-insights',
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const handleViewConversations = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
    setShowConversationViewer(true);
  };

  const handleContactStudent = (studentId: string) => {
    if (onContactStudent) {
      onContactStudent(studentId);
    }
  };

  const isLoading = overviewLoading || strugglingLoading || engagementLoading;
  const hasErrors = overviewError || strugglingError || engagementError;

  // Validate that overview has all required fields
  const isValidOverview = overview &&
    typeof overview.averageGrade === 'number' &&
    typeof overview.passingRate === 'number' &&
    typeof overview.averageCompletionRate === 'number';

  const hasAnyData = isValidOverview || strugglingStudents.length > 0 || engagementMetrics;

  return (
    <>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Class Analytics & Insights</h3>
                <p className="text-sm text-neutral-600">Performance metrics and AI-powered insights</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'overview'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Performance
              </button>
              <button
                onClick={() => setActiveTab('ai-insights')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'ai-insights'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-2" />
                AI Insights
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="max-h-[600px] overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Performance Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                {isLoading ? (
                  <div className="py-12">
                    <LoadingSpinner size="lg" message="Loading analytics..." />
                  </div>
                ) : !hasAnyData || hasErrors ? (
                  <EmptyState
                    icon={BarChart3}
                    title="Analytics Not Available Yet"
                    message="Performance analytics will appear here once students start submitting assignments and engaging with course materials. Check back soon!"
                    variant="subtle"
                  />
                ) : (
                  <>
                    {/* Class Overview */}
                    {isValidOverview && <ClassOverview overview={overview!} title="Performance Overview" />}

                    {/* Two-column layout for engagement and struggling students */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                      {/* Engagement Metrics */}
                      {engagementMetrics && (
                        <div className="lg:col-span-2">
                          <EngagementMetricsDisplay data={engagementMetrics} />
                        </div>
                      )}

                      {/* Struggling Students */}
                      {strugglingStudents.length > 0 && (
                        <div className="lg:col-span-1">
                          <StrugglingStudents
                            students={strugglingStudents}
                            onContactStudent={handleContactStudent}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

              {/* AI Insights Tab */}
              {activeTab === 'ai-insights' && (
                <motion.div
                  key="ai-insights"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                {/* Time Range Filter */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-neutral-700">
                    Student AI Usage Insights
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={timeRange === '7' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setTimeRange('7')}
                    >
                      7 Days
                    </Button>
                    <Button
                      variant={timeRange === '30' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setTimeRange('30')}
                    >
                      30 Days
                    </Button>
                    <Button
                      variant={timeRange === 'all' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setTimeRange('all')}
                    >
                      All Time
                    </Button>
                  </div>
                </div>

                {aiInsightsLoading ? (
                  <div className="py-12">
                    <LoadingSpinner size="lg" message="Loading AI insights..." />
                  </div>
                ) : aiInsights ? (
                  <>
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={Users}
                        label="Students Using AI"
                        value={aiInsights.totalUniqueStudents || 0}
                        color="primary"
                      />
                      <StatCard
                        icon={MessageSquare}
                        label="AI Conversations"
                        value={aiInsights.totalConversations || 0}
                        color="secondary"
                      />
                      <StatCard
                        icon={CheckCircle}
                        label="Helpfulness Rating"
                        value={aiInsights.helpfulnessRating ? `${Math.round(aiInsights.helpfulnessRating * 100)}%` : 'N/A'}
                        color="success"
                      />
                      <StatCard
                        icon={AlertTriangle}
                        label="Need Intervention"
                        value={aiInsights.studentsNeedingIntervention?.length || 0}
                        color="warning"
                      />
                    </div>

                    {/* Students Needing Intervention */}
                    {aiInsights.studentsNeedingIntervention &&
                      aiInsights.studentsNeedingIntervention.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200"
                        >
                          <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-orange-900 mb-2">
                                Students Needing Intervention
                              </h4>
                              <p className="text-sm text-orange-700 mb-4">
                                These students have shown signs of struggle based on their AI
                                interactions. Consider reaching out for additional support.
                              </p>
                              <div className="space-y-2">
                                {aiInsights.studentsNeedingIntervention.map((student: any) => (
                                  <div
                                    key={student.studentId}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                                  >
                                    <div>
                                      <p className="font-medium text-neutral-900">
                                        {student.studentName}
                                      </p>
                                      <p className="text-sm text-neutral-600">{student.reason}</p>
                                    </div>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        handleViewConversations(
                                          student.studentId,
                                          student.studentName
                                        )
                                      }
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Conversations
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    {/* Common Questions */}
                    {aiInsights.commonQuestions && aiInsights.commonQuestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-xl p-4 border-2 border-neutral-200"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-neutral-900">
                              Common Questions Asked
                            </h4>
                            <p className="text-sm text-neutral-600">
                              These topics came up frequently in student AI conversations
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {aiInsights.commonQuestions.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-primary-600 font-semibold text-sm">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-neutral-900 font-medium mb-1">{item.question}</p>
                                <div className="flex items-center gap-3 text-sm text-neutral-500">
                                  <span>{item.count} students asked</span>
                                  {item.concepts && item.concepts.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <div className="flex gap-2">
                                        {item.concepts.slice(0, 2).map((concept: string, i: number) => (
                                          <Badge key={i} variant="neutral" size="sm">
                                            {concept}
                                          </Badge>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Struggling Concepts */}
                    {aiInsights.strugglingConcepts && aiInsights.strugglingConcepts.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white rounded-xl p-4 border-2 border-neutral-200"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-neutral-900">
                              Struggling Concepts
                            </h4>
                            <p className="text-sm text-neutral-600">
                              Students are having difficulty with these topics
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {aiInsights.strugglingConcepts.map((concept: any, index: number) => (
                            <div key={index} className="p-4 bg-neutral-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-neutral-900">{concept.concept}</span>
                                <span className="text-sm text-neutral-600">
                                  {concept.studentCount} students
                                </span>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-warning-500 to-warning-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${
                                      (concept.questionCount / aiInsights.totalMessages) * 100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-sm text-neutral-500 mt-1">
                                {concept.questionCount} questions asked
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* No Data State */}
                    {aiInsights.totalConversations === 0 && (
                      <EmptyState
                        icon={Brain}
                        title="No AI Usage Data Yet"
                        message="Students haven't started using the AI assistant for this class yet. Data will appear here once they begin asking questions."
                        variant="subtle"
                      />
                    )}
                  </>
                ) : (
                  <EmptyState
                    icon={Brain}
                    title="Unable to Load AI Insights"
                    message="There was an error loading AI insights data. Please try again later."
                    variant="subtle"
                  />
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Student Conversation Viewer Modal */}
      {selectedStudent && showConversationViewer && (
        <StudentConversationViewer
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          onClose={() => {
            setSelectedStudent(null);
            setShowConversationViewer(false);
          }}
        />
      )}
    </>
  );
};
