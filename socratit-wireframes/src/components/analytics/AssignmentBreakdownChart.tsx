// ============================================================================
// ASSIGNMENT BREAKDOWN CHART COMPONENT
// Batch 7: Breakdown performance by assignment type (Quiz, Test, Homework, etc.)
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { AssignmentTypeBreakdown } from '../../types/analytics.types';

interface AssignmentBreakdownChartProps {
  data: AssignmentTypeBreakdown[];
  title?: string;
}

export const AssignmentBreakdownChart: React.FC<AssignmentBreakdownChartProps> = ({
  data,
  title = 'Assignment Type Breakdown',
}) => {
  // Sort by average score (lowest first to highlight areas needing improvement)
  const sortedData = [...data].sort((a, b) => a.averageScore - b.averageScore);

  // Calculate summary stats
  const overallAverage = data.length > 0
    ? data.reduce((sum, item) => sum + item.averageScore * item.totalAssignments, 0) /
      data.reduce((sum, item) => sum + item.totalAssignments, 0)
    : 0;
  const overallCompletionRate = data.length > 0
    ? data.reduce((sum, item) => sum + item.completionRate * item.totalAssignments, 0) /
      data.reduce((sum, item) => sum + item.totalAssignments, 0)
    : 0;
  const totalAssignments = data.reduce((sum, item) => sum + item.totalAssignments, 0);
  const totalCompleted = data.reduce((sum, item) => sum + item.completedAssignments, 0);
  const bestType = data.length > 0
    ? data.reduce((best, item) => item.averageScore > best.averageScore ? item : best)
    : null;

  // Color schemes for assignment types
  const typeColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    Quiz: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600'
    },
    Test: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600'
    },
    Homework: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      gradient: 'from-green-500 to-green-600'
    },
    Project: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-orange-600'
    },
    Lab: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    default: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      gradient: 'from-slate-500 to-slate-600'
    },
  };

  const getTypeColor = (type: string) => typeColors[type] || typeColors.default;

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-orange to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">
                {data.length} assignment type{data.length !== 1 ? 's' : ''} tracked
              </p>
            </div>
          </div>

          {bestType && (
            <Badge variant="success" size="sm">
              <Award className="w-3 h-3 mr-1" />
              Best: {bestType.type}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Overall Average
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {overallAverage.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Across all types
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completion Rate
              </div>
              <div className="text-2xl font-bold text-green-900">
                {overallCompletionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-green-600 mt-1">
                {totalCompleted} of {totalAssignments}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="text-xs text-purple-700 font-medium mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Total Assignments
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {totalAssignments}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {data.length} different types
              </div>
            </div>
          </div>

          {/* Assignment Type Cards */}
          {sortedData.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">
                Performance by Assignment Type
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedData.map((item, index) => {
                  const colors = getTypeColor(item.type);
                  const scoreColor = getScoreColor(item.averageScore);
                  const completionWidth = item.completionRate;
                  const scoreWidth = item.averageScore;

                  return (
                    <motion.div
                      key={item.type}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white rounded-xl p-5 border-2 ${colors.border} hover:shadow-lg transition-shadow`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${colors.gradient} rounded-lg flex items-center justify-center text-white shadow-md`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-base font-bold text-slate-900">
                              {item.type}
                            </h5>
                            <p className="text-xs text-slate-600">
                              {item.totalAssignments} assignment{item.totalAssignments !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${scoreColor}`}>
                          {item.averageScore.toFixed(1)}%
                        </div>
                      </div>

                      {/* Progress Bars */}
                      <div className="space-y-3">
                        {/* Score Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-700">Average Score</span>
                            <span className={`font-bold ${scoreColor}`}>
                              {item.averageScore.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: `${scoreWidth}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                            />
                          </div>
                        </div>

                        {/* Completion Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-700">Completion Rate</span>
                            <span className="font-bold text-slate-600">
                              {item.completedAssignments}/{item.totalAssignments}
                            </span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${completionWidth}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stats Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-xs text-slate-600">
                          <span className="font-medium">
                            {item.completedAssignments}
                          </span>{' '}
                          completed
                        </div>
                        {item.completionRate < 100 && (
                          <Badge variant="warning" size="sm">
                            {item.totalAssignments - item.completedAssignments} pending
                          </Badge>
                        )}
                        {item.completionRate === 100 && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            All done
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No assignment data available</p>
              <p className="text-sm text-slate-500 mt-1">
                Complete assignments to see breakdown by type
              </p>
            </div>
          )}

          {/* Performance Comparison Chart */}
          {sortedData.length > 1 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">
                Relative Performance Comparison
              </h4>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="space-y-2">
                  {sortedData.map((item, index) => {
                    const colors = getTypeColor(item.type);
                    const percentage = (item.averageScore / 100) * 100;

                    return (
                      <div key={item.type} className="flex items-center gap-3">
                        <div className="w-24 text-xs font-medium text-slate-700 truncate">
                          {item.type}
                        </div>
                        <div className="flex-1 h-8 bg-slate-200 rounded-lg overflow-hidden relative">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${colors.gradient} flex items-center justify-end pr-2`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          >
                            <span className="text-xs font-bold text-white drop-shadow">
                              {item.averageScore.toFixed(1)}%
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
