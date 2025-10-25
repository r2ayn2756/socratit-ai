// ============================================================================
// ASSIGNMENT PERFORMANCE TABLE COMPONENT
// Batch 7: Detailed table showing per-assignment stats for class
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, TrendingDown, Users, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { AssignmentPerformanceDetail, formatTimeSpent } from '../../types/analytics.types';

interface AssignmentPerformanceTableProps {
  data: AssignmentPerformanceDetail[];
  title?: string;
}

type SortField = 'title' | 'avgScore' | 'completionRate' | 'submittedCount' | 'avgTimeSpent';
type SortDirection = 'asc' | 'desc';

export const AssignmentPerformanceTable: React.FC<AssignmentPerformanceTableProps> = ({
  data,
  title = 'Assignment Performance Details',
}) => {
  const [sortField, setSortField] = useState<SortField>('avgScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case 'title':
        aVal = a.title;
        bVal = b.title;
        break;
      case 'avgScore':
        aVal = a.avgScore;
        bVal = b.avgScore;
        break;
      case 'completionRate':
        aVal = a.completionRate;
        bVal = b.completionRate;
        break;
      case 'submittedCount':
        aVal = a.submissionCount;
        bVal = b.submissionCount;
        break;
      case 'avgTimeSpent':
        aVal = a.timeSpent || 0;
        bVal = b.timeSpent || 0;
        break;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-400" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-brand-blue" />
    ) : (
      <ChevronDown className="w-3 h-3 text-brand-blue" />
    );
  };

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
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">
                {data.length} assignment{data.length !== 1 ? 's' : ''} tracked
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {sortedData.length > 0 ? (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center gap-1">
                          Assignment
                          <SortIcon field="title" />
                        </div>
                      </th>
                      <th
                        className="text-center px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleSort('avgScore')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Avg Score
                          <SortIcon field="avgScore" />
                        </div>
                      </th>
                      <th
                        className="text-center px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleSort('completionRate')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Completion
                          <SortIcon field="completionRate" />
                        </div>
                      </th>
                      <th
                        className="text-center px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleSort('submittedCount')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Submitted
                          <SortIcon field="submittedCount" />
                        </div>
                      </th>
                      <th
                        className="text-center px-4 py-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleSort('avgTimeSpent')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Avg Time
                          <SortIcon field="avgTimeSpent" />
                        </div>
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((assignment, index) => {
                      const isExpanded = expandedRow === assignment.assignmentId;
                      const scoreColor = getScoreColor(assignment.avgScore);

                      return (
                        <React.Fragment key={assignment.assignmentId}>
                          <motion.tr
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => setExpandedRow(isExpanded ? null : assignment.assignmentId)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <div>
                                  <div className="text-sm font-medium text-slate-900">
                                    {assignment.assignmentTitle || assignment.title}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {assignment.assignmentType || assignment.type}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className={`text-base font-bold ${scoreColor}`}>
                                {assignment.avgScore.toFixed(1)}%
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-semibold text-slate-700">
                                  {assignment.completionRate.toFixed(0)}%
                                </span>
                                <div className="w-full max-w-[100px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                                    style={{ width: `${assignment.completionRate}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Users className="w-3 h-3 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">
                                  {assignment.submittedCount || assignment.submissionCount}/{assignment.totalStudents}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">
                                  {formatTimeSpent(assignment.avgTimeSpent || assignment.timeSpent || 0)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {assignment.avgScore >= 80 && assignment.completionRate >= 80 ? (
                                <Badge variant="success" size="sm">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Strong
                                </Badge>
                              ) : assignment.avgScore >= 70 || assignment.completionRate >= 70 ? (
                                <Badge variant="primary" size="sm">
                                  Good
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  Review
                                </Badge>
                              )}
                            </td>
                          </motion.tr>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.2 }}
                              className="bg-slate-50"
                            >
                              <td colSpan={6} className="px-4 py-4">
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                                    <div className="text-xs text-slate-600 font-medium mb-1">
                                      Highest Score
                                    </div>
                                    <div className="text-xl font-bold text-green-600">
                                      {(assignment.highestScore || 0).toFixed(1)}%
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                                    <div className="text-xs text-slate-600 font-medium mb-1">
                                      Lowest Score
                                    </div>
                                    <div className="text-xl font-bold text-red-600">
                                      {(assignment.lowestScore || 0).toFixed(1)}%
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                                    <div className="text-xs text-slate-600 font-medium mb-1">
                                      Not Submitted
                                    </div>
                                    <div className="text-xl font-bold text-orange-600">
                                      {assignment.totalStudents - (assignment.submittedCount || assignment.submissionCount)}
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                                    <div className="text-xs text-slate-600 font-medium mb-1">
                                      Total Time
                                    </div>
                                    <div className="text-xl font-bold text-blue-600">
                                      {formatTimeSpent((assignment.avgTimeSpent || assignment.timeSpent || 0) * (assignment.submittedCount || assignment.submissionCount))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-600 font-medium mb-1">Total Assignments</div>
                    <div className="text-2xl font-bold text-slate-900">{data.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 font-medium mb-1">Avg Class Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(
                      data.reduce((sum, a) => sum + a.avgScore, 0) / data.length
                    )}`}>
                      {(data.reduce((sum, a) => sum + a.avgScore, 0) / data.length).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 font-medium mb-1">Avg Completion</div>
                    <div className="text-2xl font-bold text-green-600">
                      {(data.reduce((sum, a) => sum + a.completionRate, 0) / data.length).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 font-medium mb-1">Avg Time</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatTimeSpent(
                        data.reduce((sum, a) => sum + (a.avgTimeSpent || a.timeSpent || 0), 0) / data.length
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No assignment data available</p>
              <p className="text-sm text-slate-500 mt-1">
                Create assignments and wait for student submissions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
