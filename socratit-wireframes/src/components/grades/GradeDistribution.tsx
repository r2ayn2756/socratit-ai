// ============================================================================
// GRADE DISTRIBUTION COMPONENT
// Display class grade distribution with animated bar chart
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { GradeDistribution as GradeDistributionType, formatLetterGrade, getGradeColor } from '../../types/grade.types';

interface GradeDistributionProps {
  distribution: GradeDistributionType;
  totalStudents: number;
  title?: string;
  showPercentages?: boolean;
}

export const GradeDistribution: React.FC<GradeDistributionProps> = ({
  distribution,
  totalStudents,
  title = 'Grade Distribution',
  showPercentages = true,
}) => {
  // Convert distribution to array for easier rendering
  const distributionData = [
    { grade: 'A_PLUS', count: distribution.A_PLUS, label: 'A+' },
    { grade: 'A', count: distribution.A, label: 'A' },
    { grade: 'A_MINUS', count: distribution.A_MINUS, label: 'A-' },
    { grade: 'B_PLUS', count: distribution.B_PLUS, label: 'B+' },
    { grade: 'B', count: distribution.B, label: 'B' },
    { grade: 'B_MINUS', count: distribution.B_MINUS, label: 'B-' },
    { grade: 'C_PLUS', count: distribution.C_PLUS, label: 'C+' },
    { grade: 'C', count: distribution.C, label: 'C' },
    { grade: 'C_MINUS', count: distribution.C_MINUS, label: 'C-' },
    { grade: 'D_PLUS', count: distribution.D_PLUS, label: 'D+' },
    { grade: 'D', count: distribution.D, label: 'D' },
    { grade: 'D_MINUS', count: distribution.D_MINUS, label: 'D-' },
    { grade: 'F', count: distribution.F, label: 'F' },
  ];

  // Filter out grades with 0 count for cleaner display
  const nonZeroGrades = distributionData.filter(d => d.count > 0);

  // Find max count for scaling bars
  const maxCount = Math.max(...distributionData.map(d => d.count), 1);

  // Calculate class statistics
  const passingCount = totalStudents - distribution.F;
  const passingRate = totalStudents > 0 ? (passingCount / totalStudents) * 100 : 0;

  // Get color classes based on letter grade
  const getGradeColorClass = (grade: string) => {
    if (grade.startsWith('A')) return 'from-green-500 to-green-600';
    if (grade.startsWith('B')) return 'from-blue-500 to-blue-600';
    if (grade.startsWith('C')) return 'from-yellow-500 to-yellow-600';
    if (grade.startsWith('D')) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600'; // F
  };

  const getGradeBgClass = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-50';
    if (grade.startsWith('B')) return 'bg-blue-50';
    if (grade.startsWith('C')) return 'bg-yellow-50';
    if (grade.startsWith('D')) return 'bg-orange-50';
    return 'bg-red-50'; // F
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">
              {totalStudents} student{totalStudents !== 1 ? 's' : ''} graded
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {Math.round(passingRate)}%
            </div>
            <div className="text-xs text-slate-600">Passing Rate</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Statistics Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Excellent</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {distribution.A_PLUS + distribution.A + distribution.A_MINUS}
              </div>
              <div className="text-xs text-green-600">A Range</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Proficient</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {distribution.B_PLUS + distribution.B + distribution.B_MINUS}
              </div>
              <div className="text-xs text-blue-600">B Range</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">At Risk</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {distribution.D_PLUS + distribution.D + distribution.D_MINUS + distribution.F}
              </div>
              <div className="text-xs text-orange-600">D-F Range</div>
            </div>
          </div>

          {/* Grade Distribution Chart */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Detailed Distribution
            </h4>
            {distributionData.map((item, index) => {
              const percentage = totalStudents > 0 ? (item.count / totalStudents) * 100 : 0;
              const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

              return (
                <motion.div
                  key={item.grade}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative"
                >
                  <div className="flex items-center gap-3">
                    {/* Grade Label */}
                    <div className={`w-12 h-10 ${getGradeBgClass(item.grade)} rounded-lg flex items-center justify-center border border-slate-200`}>
                      <span className="text-sm font-bold text-slate-900">
                        {item.label}
                      </span>
                    </div>

                    {/* Bar Chart */}
                    <div className="flex-1">
                      <div className="relative w-full bg-slate-100 rounded-full h-10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.03 + 0.2 }}
                          className={`h-full bg-gradient-to-r ${getGradeColorClass(item.grade)} flex items-center justify-end pr-3`}
                        >
                          {item.count > 0 && (
                            <span className="text-xs font-bold text-white drop-shadow-md">
                              {item.count}
                            </span>
                          )}
                        </motion.div>

                        {/* Count badge (shown when bar is too small) */}
                        {item.count > 0 && barWidth < 15 && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <span className="text-xs font-bold text-slate-700">
                              {item.count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Percentage */}
                    {showPercentages && (
                      <div className="w-14 text-right">
                        <span className="text-sm font-semibold text-slate-700">
                          {totalStudents > 0 ? Math.round(percentage) : 0}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {totalStudents === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No grades yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Grade distributions will appear after assignments are graded
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
