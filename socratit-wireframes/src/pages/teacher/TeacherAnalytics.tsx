// ============================================================================
// TEACHER ANALYTICS PAGE - BATCH 7 COMPLETE
// Comprehensive analytics dashboard with all Batch 7 features
//
// ⚠️ DEPRECATION NOTICE:
// This standalone analytics page has been REMOVED from the sidebar navigation.
// Analytics features should be integrated into individual ClassDashboard pages
// (see: pages/teacher/ClassDashboard.tsx) to provide better class-specific context.
//
// This file is kept for reference and for the reusable components it contains.
// The components in this file can be imported and used within ClassDashboard.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { classService } from '../../services/class.service';

// Batch 7 Components
import { PerformanceTimelineChart } from '../../components/analytics/PerformanceTimelineChart';
import { ConceptComparisonChart } from '../../components/analytics/ConceptComparisonChart';
import { AssignmentBreakdownChart } from '../../components/analytics/AssignmentBreakdownChart';
import { PerformanceDistributionChart } from '../../components/analytics/PerformanceDistributionChart';
import { ConceptMasteryHeatmap } from '../../components/analytics/ConceptMasteryHeatmap';
import { EngagementMetricsDisplay } from '../../components/analytics/EngagementMetricsDisplay';
import { AssignmentPerformanceTable } from '../../components/analytics/AssignmentPerformanceTable';
import { RecommendationsPanel } from '../../components/analytics/RecommendationsPanel';
import { ExportButton, MultiExportButton } from '../../components/analytics/ExportButton';

// Batch 5 Components
import { ClassOverview } from '../../components/analytics/ClassOverview';
import { StrugglingStudents } from '../../components/analytics/StrugglingStudents';

// Services
import {
  getClassOverview,
  getStrugglingStudents,
  recalculateClassAnalytics,
  getPerformanceTimeline,
  getConceptComparison,
  getAssignmentBreakdown,
  getPerformanceDistribution,
  getConceptMasteryHeatmap,
  getEngagementMetrics,
  getAssignmentPerformance,
  generateRecommendations,
  trackEvent,
} from '../../services/analytics.service';

// Types
import {
  ClassOverview as ClassOverviewType,
  TimelineDataPoint,
  ConceptComparison,
  AssignmentTypeBreakdown,
  DistributionStats,
  ConceptHeatmapData,
  EngagementMetrics,
  AssignmentPerformanceDetail,
  RecommendationData,
} from '../../types/analytics.types';

// Icons
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Filter,
  Eye,
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

interface TeacherAnalyticsProps {
  selectedClassId?: string;
}

export const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({ selectedClassId }) => {
  // Get classId from URL params if available
  const { classId: urlClassId } = useParams<{ classId: string }>();

  // State - prioritize URL param, then prop, then 'all'
  const [classFilter, setClassFilter] = useState<string>(urlClassId || selectedClassId || 'all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [timeGranularity, setTimeGranularity] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'concepts' | 'engagement'>('overview');

  // Batch 5 Data
  const [overview, setOverview] = useState<ClassOverviewType | null>(null);
  const [strugglingStudents, setStrugglingStudents] = useState<any[]>([]);

  // Batch 7 Data
  const [performanceTimeline, setPerformanceTimeline] = useState<TimelineDataPoint[]>([]);
  const [conceptComparison, setConceptComparison] = useState<ConceptComparison[]>([]);
  const [assignmentBreakdown, setAssignmentBreakdown] = useState<AssignmentTypeBreakdown[]>([]);
  const [performanceDistribution, setPerformanceDistribution] = useState<DistributionStats | null>(null);
  const [conceptHeatmap, setConceptHeatmap] = useState<ConceptHeatmapData[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [assignmentPerformance, setAssignmentPerformance] = useState<AssignmentPerformanceDetail[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);

  // Fetch teacher's classes from backend
  const { data: teacherClasses } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getTeacherClasses(),
  });

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    if (classFilter === 'all') {
      setError('Please select a specific class to view analytics');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Track page view
      await trackEvent('analytics_page_view', { classId: classFilter });

      // Fetch Batch 5 data
      const [overviewData, strugglingData] = await Promise.all([
        getClassOverview(classFilter),
        getStrugglingStudents(classFilter),
      ]);

      setOverview(overviewData);
      setStrugglingStudents(strugglingData);

      // Fetch Batch 7 data for class-level analytics
      const [
        distributionData,
        heatmapData,
        engagementData,
        assignmentPerfData,
      ] = await Promise.all([
        getPerformanceDistribution(classFilter),
        getConceptMasteryHeatmap(classFilter),
        getEngagementMetrics(classFilter),
        getAssignmentPerformance(classFilter),
      ]);

      setPerformanceDistribution(distributionData);
      setConceptHeatmap(heatmapData);
      setEngagementMetrics(engagementData);
      setAssignmentPerformance(assignmentPerfData);

      // If a student is selected, fetch student-specific data
      if (selectedStudentId) {
        await fetchStudentAnalytics(selectedStudentId);
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student-specific analytics
  const fetchStudentAnalytics = async (studentId: string) => {
    if (!classFilter || classFilter === 'all') return;

    try {
      const [timelineData, comparisonData, breakdownData] = await Promise.all([
        getPerformanceTimeline(studentId, classFilter, undefined, undefined, timeGranularity),
        getConceptComparison(studentId, classFilter),
        getAssignmentBreakdown(studentId, classFilter),
      ]);

      setPerformanceTimeline(timelineData);
      setConceptComparison(comparisonData);
      setAssignmentBreakdown(breakdownData);
    } catch (err: any) {
      console.error('Failed to fetch student analytics:', err);
    }
  };

  // Generate AI recommendations
  const handleGenerateRecommendations = async (focus?: 'concepts' | 'assignments' | 'engagement' | 'overall') => {
    if (!selectedStudentId || classFilter === 'all') return;

    try {
      setLoadingRecommendations(true);
      await trackEvent('generate_recommendations', { studentId: selectedStudentId, classId: classFilter, focus });
      const data = await generateRecommendations(selectedStudentId, classFilter, focus);
      setRecommendations(data);
    } catch (err: any) {
      console.error('Failed to generate recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Recalculate analytics
  const handleRecalculate = async () => {
    if (classFilter === 'all') return;

    try {
      setRecalculating(true);
      await trackEvent('recalculate_analytics', { classId: classFilter });
      await recalculateClassAnalytics(classFilter);
      await fetchAnalytics();
    } catch (err: any) {
      console.error('Failed to recalculate analytics:', err);
      setError(err.message || 'Failed to recalculate analytics');
    } finally {
      setRecalculating(false);
    }
  };

  // Handle student selection
  const handleStudentSelect = async (studentId: string) => {
    setSelectedStudentId(studentId);
    await trackEvent('select_student', { studentId, classId: classFilter });
    if (classFilter !== 'all') {
      await fetchStudentAnalytics(studentId);
    }
  };

  // Handle contact student
  const handleContactStudent = (studentId: string) => {
    trackEvent('contact_student', { studentId, classId: classFilter });
    console.log('Contact student:', studentId);
    // TODO: Implement contact functionality
  };

  // Handle granularity change
  const handleGranularityChange = async (granularity: 'day' | 'week' | 'month') => {
    setTimeGranularity(granularity);
    if (selectedStudentId && classFilter !== 'all') {
      const data = await getPerformanceTimeline(selectedStudentId, classFilter, undefined, undefined, granularity);
      setPerformanceTimeline(data);
    }
  };

  // Effects
  useEffect(() => {
    // Update classFilter when URL params change
    if (urlClassId && urlClassId !== classFilter) {
      setClassFilter(urlClassId);
    }
  }, [urlClassId]);

  useEffect(() => {
    if (classFilter !== 'all') {
      fetchAnalytics();
    }
  }, [classFilter]);

  return (
    <DashboardLayout userRole="teacher">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Comprehensive performance insights powered by AI
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white text-slate-900"
            >
              <option value="all">All Classes</option>
              {teacherClasses?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            {/* Export Button */}
            {classFilter !== 'all' && (
              <MultiExportButton type="class" classId={classFilter} />
            )}

            {/* Recalculate Button */}
            <Button
              variant="primary"
              size="md"
              onClick={handleRecalculate}
              disabled={recalculating || classFilter === 'all'}
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculating...' : 'Recalculate'}
            </Button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        {classFilter !== 'all' && (
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
              {(['overview', 'performance', 'concepts', 'engagement'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    trackEvent('switch_analytics_tab', { tab, classId: classFilter });
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab
                      ? 'bg-brand-blue text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Content */}
        {classFilter === 'all' ? (
          <motion.div variants={fadeInUp}>
            <Card>
              <div className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Select a Class to View Analytics
                </h3>
                <p className="text-slate-600">
                  Choose a class from the dropdown above to see comprehensive analytics and insights
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
                <p className="text-slate-600">Loading analytics data...</p>
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
                <Button onClick={fetchAnalytics} variant="primary">
                  Try Again
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Class Overview */}
                {overview && (
                  <motion.div variants={fadeInUp}>
                    <ClassOverview overview={overview} />
                  </motion.div>
                )}

                {/* Three-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Performance Distribution */}
                  <div className="lg:col-span-2 space-y-6">
                    {performanceDistribution && (
                      <motion.div variants={fadeInUp}>
                        <PerformanceDistributionChart data={performanceDistribution} />
                      </motion.div>
                    )}

                    {/* Engagement Metrics */}
                    {engagementMetrics && (
                      <motion.div variants={fadeInUp}>
                        <EngagementMetricsDisplay data={engagementMetrics} />
                      </motion.div>
                    )}
                  </div>

                  {/* Right: Struggling Students */}
                  <div className="space-y-6">
                    {strugglingStudents.length > 0 && (
                      <motion.div variants={fadeInUp}>
                        <StrugglingStudents
                          students={strugglingStudents}
                          onContactStudent={handleContactStudent}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Assignment Performance Table */}
                {assignmentPerformance.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <AssignmentPerformanceTable data={assignmentPerformance} />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && selectedStudentId && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Student Selector */}
                <motion.div variants={fadeInUp}>
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Student Performance Analysis</h3>
                        <p className="text-sm text-slate-600 mt-1">Select a student to view detailed analytics</p>
                      </div>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => handleStudentSelect(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                      >
                        {strugglingStudents.map((student) => (
                          <option key={student.studentId} value={student.studentId}>
                            {student.studentName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Card>
                </motion.div>

                {/* Performance Timeline */}
                {performanceTimeline.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <PerformanceTimelineChart
                      data={performanceTimeline}
                      granularity={timeGranularity}
                      onGranularityChange={handleGranularityChange}
                    />
                  </motion.div>
                )}

                {/* Assignment Breakdown */}
                {assignmentBreakdown.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <AssignmentBreakdownChart data={assignmentBreakdown} />
                  </motion.div>
                )}

                {/* AI Recommendations */}
                <motion.div variants={fadeInUp}>
                  <RecommendationsPanel
                    data={recommendations}
                    loading={loadingRecommendations}
                    studentName={strugglingStudents.find(s => s.studentId === selectedStudentId)?.studentName}
                    onRefresh={handleGenerateRecommendations}
                  />
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'performance' && !selectedStudentId && (
              <motion.div variants={fadeInUp}>
                <Card>
                  <div className="p-12 text-center">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Select a Student
                    </h3>
                    <p className="text-slate-600">
                      Choose a student to view detailed performance analytics
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Concepts Tab */}
            {activeTab === 'concepts' && (
              <motion.div
                key="concepts"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Concept Mastery Heatmap */}
                {conceptHeatmap.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <ConceptMasteryHeatmap data={conceptHeatmap} />
                  </motion.div>
                )}

                {/* Concept Comparison (if student selected) */}
                {selectedStudentId && conceptComparison.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <ConceptComparisonChart
                      data={conceptComparison}
                      studentName={strugglingStudents.find(s => s.studentId === selectedStudentId)?.studentName}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Engagement Tab */}
            {activeTab === 'engagement' && (
              <motion.div
                key="engagement"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {engagementMetrics && (
                  <motion.div variants={fadeInUp}>
                    <EngagementMetricsDisplay data={engagementMetrics} />
                  </motion.div>
                )}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
