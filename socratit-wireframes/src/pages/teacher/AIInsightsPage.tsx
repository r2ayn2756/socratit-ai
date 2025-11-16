// ============================================================================
// AI INSIGHTS PAGE - Teacher View
// Analytics dashboard for AI usage and student struggles
//
// ⚠️ DEPRECATION NOTICE:
// This standalone AI Insights page has been REMOVED from the sidebar navigation.
// AI Insights features should be integrated into individual ClassDashboard pages
// (see: pages/teacher/ClassDashboard.tsx) to provide better class-specific context.
//
// This file is kept for reference and for the reusable components it contains.
// The components in this file can be imported and used within ClassDashboard.
// ============================================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { aiTAService } from '../../services/aiTA.service';
import { classService } from '../../services/class.service';
import { assignmentService } from '../../services/assignment.service';
import { StudentConversationViewer } from '../../components/ai/StudentConversationViewer';
import {
  Brain,
  MessageSquare,
  Users,
  AlertTriangle,
  TrendingUp,
  Filter,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface AIInsightsPageProps {
  selectedClassId?: string;
}

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({ selectedClassId }) => {
  const { classId: urlClassId } = useParams<{ classId: string }>();
  const [classFilter, setClassFilter] = useState<string>(urlClassId || selectedClassId || '');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('30');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [showConversationViewer, setShowConversationViewer] = useState(false);

  // Calculate date range based on timeRange
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

  // Fetch teacher's classes
  const { data: teacherClasses } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getTeacherClasses(),
  });

  // Fetch assignments for selected class
  const { data: assignmentsData } = useQuery({
    queryKey: ['class-assignments', classFilter],
    queryFn: () => assignmentService.getAssignments({ classId: classFilter }),
    enabled: !!classFilter && classFilter !== '',
  });

  const assignments = assignmentsData?.data || [];

  // Fetch AI insights for selected class
  const { periodStart, periodEnd } = getDateRange();
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['ai-insights', classFilter, periodStart, periodEnd],
    queryFn: () => aiTAService.getClassInsights(classFilter, periodStart, periodEnd),
    enabled: !!classFilter && classFilter !== '',
  });

  const handleViewConversations = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
    setShowConversationViewer(true);
  };

  // No class selected state
  if (!classFilter || classFilter === '') {
    return (
      <DashboardLayout userRole="teacher">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">AI Usage Insights</h1>
            <p className="text-slate-600">View how students are using AI assistance</p>
          </div>

          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Brain className="w-12 h-12 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Select a Class to View AI Insights
              </h3>
              <p className="text-slate-600 mb-6">
                Choose a class from the dropdown above to see AI usage analytics and student conversations.
              </p>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">AI Usage Insights</h1>
            <p className="text-slate-600">Monitor how students are using AI assistance</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Class
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              >
                <option value="">Select a class</option>
                {teacherClasses?.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assignment
              </label>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              >
                <option value="all">All Assignments</option>
                {assignments?.map((assignment: any) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Time Range
              </label>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === '7' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeRange('7')}
                  className="flex-1"
                >
                  7 Days
                </Button>
                <Button
                  variant={timeRange === '30' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeRange('30')}
                  className="flex-1"
                >
                  30 Days
                </Button>
                <Button
                  variant={timeRange === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeRange('all')}
                  className="flex-1"
                >
                  All Time
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {insightsLoading && (
          <Card className="p-12 text-center">
            <div className="text-slate-600">Loading AI insights...</div>
          </Card>
        )}

        {/* Overview Stats */}
        {!insightsLoading && insights && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {insights.totalUniqueStudents || 0}
                    </p>
                    <p className="text-sm text-slate-600">Students Using AI</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-brand-purple" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {insights.totalConversations || 0}
                    </p>
                    <p className="text-sm text-slate-600">AI Conversations</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {insights.helpfulnessRating ? `${Math.round(insights.helpfulnessRating * 100)}%` : 'N/A'}
                    </p>
                    <p className="text-sm text-slate-600">Helpfulness Rating</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {insights.studentsNeedingIntervention?.length || 0}
                    </p>
                    <p className="text-sm text-slate-600">Need Intervention</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Struggling Students Alert */}
            {insights.studentsNeedingIntervention && insights.studentsNeedingIntervention.length > 0 && (
              <Card className="p-6 border-l-4 border-orange-500 bg-orange-50">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      Students Needing Intervention
                    </h3>
                    <p className="text-slate-600 mb-4">
                      These students have shown signs of struggle based on their AI interactions. Consider reaching out for additional support.
                    </p>
                    <div className="space-y-2">
                      {insights.studentsNeedingIntervention.map((student: any) => (
                        <div
                          key={student.studentId}
                          className="flex items-center justify-between p-3 bg-white rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-slate-800">{student.studentName}</p>
                            <p className="text-sm text-slate-600">{student.reason}</p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewConversations(student.studentId, student.studentName)}
                          >
                            View Conversations
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Common Questions */}
            {insights.commonQuestions && insights.commonQuestions.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  Common Questions Asked
                </h3>
                <p className="text-slate-600 mb-4">
                  These topics came up frequently in student AI conversations. Consider addressing them in class.
                </p>
                <div className="space-y-3">
                  {insights.commonQuestions.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-blue font-semibold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-800 font-medium mb-1">{item.question}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
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
              </Card>
            )}

            {/* Struggling Concepts */}
            {insights.strugglingConcepts && insights.strugglingConcepts.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  Struggling Concepts
                </h3>
                <p className="text-slate-600 mb-4">
                  Students are having difficulty with these topics. Consider reteaching or providing additional resources.
                </p>
                <div className="space-y-3">
                  {insights.strugglingConcepts.map((concept: any, index: number) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800">{concept.concept}</span>
                        <span className="text-sm text-slate-600">{concept.studentCount} students</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${(concept.questionCount / insights.totalMessages) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {concept.questionCount} questions asked
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* No Data State */}
        {!insightsLoading && insights && insights.totalConversations === 0 && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <MessageSquare className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                No AI Usage Data Yet
              </h3>
              <p className="text-slate-600">
                Students haven't started using the AI assistant for this class yet. Data will appear here once they begin asking questions.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Student Conversation Viewer Modal */}
      {selectedStudent && showConversationViewer && (
        <StudentConversationViewer
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          assignmentId={assignmentFilter !== 'all' ? assignmentFilter : undefined}
          onClose={() => {
            setSelectedStudent(null);
            setShowConversationViewer(false);
          }}
        />
      )}
    </DashboardLayout>
  );
};
