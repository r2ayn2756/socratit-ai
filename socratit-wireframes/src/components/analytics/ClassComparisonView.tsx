// ============================================================================
// CLASS COMPARISON VIEW COMPONENT
// Batch 7: Compare multiple classes within a school (Admin only)
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Award, AlertCircle, BookOpen, Target } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { ClassComparisonData } from '../../types/analytics.types';

interface ClassComparisonViewProps {
  data: ClassComparisonData[];
  title?: string;
}

type SortField = 'className' | 'avgGrade' | 'totalStudents' | 'completionRate' | 'strugglingCount';
type SortDirection = 'asc' | 'desc';

export const ClassComparisonView: React.FC<ClassComparisonViewProps> = ({
  data,
  title = 'School-Wide Class Comparison',
}) => {
  const [sortField, setSortField] = useState<SortField>('avgGrade');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case 'className':
        aVal = a.className;
        bVal = b.className;
        break;
      case 'avgGrade':
        aVal = a.avgGrade;
        bVal = b.avgGrade;
        break;
      case 'totalStudents':
        aVal = a.totalStudents;
        bVal = b.totalStudents;
        break;
      case 'completionRate':
        aVal = a.completionRate;
        bVal = b.completionRate;
        break;
      case 'strugglingCount':
        aVal = a.strugglingCount;
        bVal = b.strugglingCount;
        break;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  // Calculate school-wide stats
  const schoolStats = {
    totalClasses: data.length,
    totalStudents: data.reduce((sum, cls) => sum + cls.totalStudents, 0),
    avgGrade: data.length > 0
      ? data.reduce((sum, cls) => sum + cls.avgGrade * cls.totalStudents, 0) /
        data.reduce((sum, cls) => sum + cls.totalStudents, 0)
      : 0,
    avgCompletionRate: data.length > 0
      ? data.reduce((sum, cls) => sum + cls.completionRate, 0) / data.length
      : 0,
    totalStruggling: data.reduce((sum, cls) => sum + cls.strugglingCount, 0),
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get grade color
  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">
                {data.length} class{data.length !== 1 ? 'es' : ''} analyzed
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* School-Wide Summary */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Total Classes
              </div>
              <div className="text-2xl font-bold text-blue-900">{schoolStats.totalClasses}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="text-xs text-purple-700 font-medium mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Total Students
              </div>
              <div className="text-2xl font-bold text-purple-900">{schoolStats.totalStudents}</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Avg Grade
              </div>
              <div className="text-2xl font-bold text-green-900">{schoolStats.avgGrade.toFixed(1)}%</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
              <div className="text-xs text-cyan-700 font-medium mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Avg Completion
              </div>
              <div className="text-2xl font-bold text-cyan-900">{schoolStats.avgCompletionRate.toFixed(1)}%</div>
            </div>

            <div className={`bg-gradient-to-br rounded-xl p-4 border ${
              schoolStats.totalStruggling > 0
                ? 'from-red-50 to-red-100 border-red-200'
                : 'from-slate-50 to-slate-100 border-slate-200'
            }`}>
              <div className={`text-xs font-medium mb-1 flex items-center gap-1 ${
                schoolStats.totalStruggling > 0 ? 'text-red-700' : 'text-slate-700'
              }`}>
                <AlertCircle className="w-3 h-3" />
                Struggling
              </div>
              <div className={`text-2xl font-bold ${
                schoolStats.totalStruggling > 0 ? 'text-red-900' : 'text-slate-900'
              }`}>
                {schoolStats.totalStruggling}
              </div>
            </div>
          </div>

          {/* Class Comparison Cards */}
          {sortedData.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">Class Performance Details</h4>
              <div className="space-y-3">
                {sortedData.map((classData, index) => {
                  const gradeColor = getGradeColor(classData.avgGrade);
                  const isTopPerformer = classData.avgGrade >= 90;
                  const needsAttention = classData.strugglingCount > classData.totalStudents * 0.2;

                  return (
                    <motion.div
                      key={classData.classId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`bg-white rounded-xl p-5 border-2 transition-all hover:shadow-lg ${
                        isTopPerformer
                          ? 'border-green-200 bg-green-50/50'
                          : needsAttention
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="text-base font-bold text-slate-900">
                              {classData.className}
                            </h5>
                            {isTopPerformer && (
                              <Badge variant="success" size="sm">
                                <Award className="w-3 h-3 mr-1" />
                                Top Performer
                              </Badge>
                            )}
                            {needsAttention && (
                              <Badge variant="warning" size="sm">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Needs Support
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Teacher: {classData.teacherName}
                          </p>
                        </div>
                        <div className={`text-3xl font-bold ${gradeColor}`}>
                          {classData.avgGrade.toFixed(1)}%
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-3">
                        {/* Total Students */}
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mb-1">
                            <Users className="w-3 h-3" />
                            Students
                          </div>
                          <div className="text-xl font-bold text-slate-900">
                            {classData.totalStudents}
                          </div>
                        </div>

                        {/* Completion Rate */}
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mb-1">
                            <Target className="w-3 h-3" />
                            Completion
                          </div>
                          <div className="text-xl font-bold text-slate-900">
                            {classData.completionRate.toFixed(0)}%
                          </div>
                        </div>

                        {/* Struggling Students */}
                        <div className={`rounded-lg p-3 border ${
                          classData.strugglingCount > 0
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${
                            classData.strugglingCount > 0 ? 'text-red-700' : 'text-slate-600'
                          }`}>
                            <AlertCircle className="w-3 h-3" />
                            Struggling
                          </div>
                          <div className={`text-xl font-bold ${
                            classData.strugglingCount > 0 ? 'text-red-900' : 'text-slate-900'
                          }`}>
                            {classData.strugglingCount}
                          </div>
                        </div>

                        {/* Active Students */}
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mb-1">
                            <TrendingUp className="w-3 h-3" />
                            Active
                          </div>
                          <div className="text-xl font-bold text-slate-900">
                            {classData.activeStudents}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>Overall Performance</span>
                          <span className={`font-bold ${gradeColor}`}>
                            {classData.avgGrade.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              classData.avgGrade >= 90 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              classData.avgGrade >= 80 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              classData.avgGrade >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                              classData.avgGrade >= 60 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                              'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${classData.avgGrade}%` }}
                            transition={{ duration: 0.8, delay: index * 0.03 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No class data available</p>
              <p className="text-sm text-slate-500 mt-1">
                Classes need to have analytics calculated
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
