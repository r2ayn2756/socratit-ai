/**
 * AI INSIGHTS DASHBOARD - Teacher View
 * Shows AI TA usage analytics and student intervention alerts
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { aiTAService } from '../../services/aiTA.service';

export const AIInsightsDashboard: React.FC<{ classId: string }> = ({ classId }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    if (timeRange === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (timeRange === 'month') {
      start.setMonth(start.getMonth() - 1);
    } else {
      start.setFullYear(start.getFullYear() - 1);
    }

    return { start: start.toISOString(), end: end.toISOString() };
  };

  const { start, end } = getDateRange();

  // Fetch insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', classId, start, end],
    queryFn: () => aiTAService.getClassInsights(classId, start, end),
    enabled: !!classId,
  });

  if (isLoading) {
    return <div className="p-6">Loading AI insights...</div>;
  }

  // Use insights data
  const overviewStats = {
    activeStudents: insights?.totalStudents || 0,
    totalConversations: insights?.totalConversations || 0,
    helpfulRate: insights?.averageHelpfulness
      ? `${Math.round(insights.averageHelpfulness * 100)}%`
      : 'N/A',
    interventionsNeeded: insights?.interventionNeeded?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Socrat It Insights</h2>
          <p className="text-slate-600">Analytics from AI Teaching Assistant usage</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'week' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{overviewStats.activeStudents}</p>
              <p className="text-sm text-slate-600">Active Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{overviewStats.totalConversations}</p>
              <p className="text-sm text-slate-600">Conversations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{overviewStats.helpfulRate}</p>
              <p className="text-sm text-slate-600">Helpful Rate</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{overviewStats.interventionsNeeded}</p>
              <p className="text-sm text-slate-600">Need Intervention</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Intervention Alerts */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Students Needing Intervention</h3>
        <div className="space-y-3">
          {(insights?.interventionNeeded || []).length === 0 ? (
            <p className="text-slate-500 text-center py-8">No students need intervention at this time.</p>
          ) : (
            (insights?.interventionNeeded || []).map((alert: any, i: number) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                alert.severity === 'medium' ? 'bg-orange-50 border-orange-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{alert.studentName}</p>
                  <p className="text-sm text-slate-600">{alert.reason}</p>
                </div>
                <Button variant="primary" size="sm">
                  View Conversation
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Common Questions */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Top Questions Asked</h3>
        <div className="space-y-3">
          {(insights?.commonQuestions || []).length === 0 ? (
            <p className="text-slate-500 text-center py-8">No common questions yet.</p>
          ) : (
            (insights?.commonQuestions || []).slice(0, 10).map((q: any, i: number) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-slate-800 flex-1">{q.question}</p>
                  <span className="ml-4 px-3 py-1 bg-brand-blue text-white text-sm rounded-full">{q.count}×</span>
                </div>
                <div className="flex gap-2">
                  {(q.concepts || []).map((concept: string, ci: number) => (
                    <span key={ci} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded">{concept}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Struggling Concepts */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Struggling Concepts</h3>
        <div className="space-y-3">
          {(insights?.strugglingConcepts || []).length === 0 ? (
            <p className="text-slate-500 text-center py-8">No struggling concepts identified.</p>
          ) : (
            (insights?.strugglingConcepts || []).slice(0, 10).map((item: any, i: number) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{item.concept}</p>
                    <p className="text-sm text-slate-600">{item.students.length} students requested help {item.helpRequestCount} times</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      item.averageMastery < 50 ? 'text-red-600' :
                      item.averageMastery < 70 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>{Math.round(item.averageMastery)}%</p>
                    <p className="text-xs text-slate-500">Avg Mastery</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${
                    item.averageMastery < 50 ? 'bg-red-500' :
                    item.averageMastery < 70 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`} style={{ width: `${Math.round(item.averageMastery)}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
