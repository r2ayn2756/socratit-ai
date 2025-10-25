// ============================================================================
// PERFORMANCE DISTRIBUTION CHART COMPONENT
// Batch 7: Grade distribution histogram for entire class
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { DistributionStats } from '../../types/analytics.types';

interface PerformanceDistributionChartProps {
  data: DistributionStats;
  title?: string;
}

export const PerformanceDistributionChart: React.FC<PerformanceDistributionChartProps> = ({
  data,
  title = 'Class Performance Distribution',
}) => {
  const { distribution, median, mean, stdDev, totalStudents } = data;

  // Find max count for scaling
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  // Grade ranges and their properties
  const gradeRanges = [
    { range: '90-100', label: 'A', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { range: '80-89', label: 'B', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { range: '70-79', label: 'C', color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
    { range: '60-69', label: 'D', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
    { range: '0-59', label: 'F', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  ];

  // Map distribution data to grade ranges
  const enrichedDistribution = distribution.map(item => {
    const gradeInfo = gradeRanges.find(g => g.range === item.range) || gradeRanges[gradeRanges.length - 1];
    return {
      ...item,
      ...gradeInfo,
      percentage: totalStudents > 0 ? (item.count / totalStudents) * 100 : 0,
      barHeight: totalStudents > 0 ? (item.count / maxCount) * 100 : 0,
    };
  });

  // Calculate struggling students (below 70%)
  const strugglingCount = distribution
    .filter(d => d.range === '60-69' || d.range === '0-59')
    .reduce((sum, d) => sum + d.count, 0);

  const excellingCount = distribution
    .filter(d => d.range === '90-100')
    .reduce((sum, d) => sum + d.count, 0);

  // Get distribution shape description
  const getDistributionShape = () => {
    const sortedByCount = [...enrichedDistribution].sort((a, b) => b.count - a.count);
    const topRange = sortedByCount[0];

    if (topRange.range === '90-100') return { text: 'High performing class', color: 'text-green-600' };
    if (topRange.range === '80-89' || topRange.range === '70-79') return { text: 'Normally distributed', color: 'text-blue-600' };
    return { text: 'Needs intervention', color: 'text-red-600' };
  };

  const shape = getDistributionShape();

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">
                {totalStudents} student{totalStudents !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${shape.color}`}>
              {shape.text}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1">Mean</div>
              <div className="text-2xl font-bold text-blue-900">
                {mean.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600 mt-1">Class average</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="text-xs text-purple-700 font-medium mb-1">Median</div>
              <div className="text-2xl font-bold text-purple-900">
                {median.toFixed(1)}%
              </div>
              <div className="text-xs text-purple-600 mt-1">Middle score</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Excelling
              </div>
              <div className="text-2xl font-bold text-green-900">
                {excellingCount}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {((excellingCount / totalStudents) * 100).toFixed(0)}% of class
              </div>
            </div>

            <div className={`bg-gradient-to-br rounded-xl p-4 border ${strugglingCount > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-slate-50 to-slate-100 border-slate-200'}`}>
              <div className={`text-xs font-medium mb-1 flex items-center gap-1 ${strugglingCount > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                <AlertCircle className="w-3 h-3" />
                Struggling
              </div>
              <div className={`text-2xl font-bold ${strugglingCount > 0 ? 'text-red-900' : 'text-slate-900'}`}>
                {strugglingCount}
              </div>
              <div className={`text-xs mt-1 ${strugglingCount > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {((strugglingCount / totalStudents) * 100).toFixed(0)}% of class
              </div>
            </div>
          </div>

          {/* Histogram */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">
                Grade Distribution
              </h4>
              <div className="text-xs text-slate-600">
                Standard Deviation: <span className="font-bold">{stdDev.toFixed(1)}%</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              {/* Histogram bars */}
              <div className="flex items-end justify-between gap-4 h-64">
                {enrichedDistribution.map((item, index) => (
                  <motion.div
                    key={item.range}
                    className="flex-1 flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Bar */}
                    <div className="w-full relative flex flex-col justify-end" style={{ height: '100%' }}>
                      <motion.div
                        className={`w-full bg-gradient-to-t ${item.color} rounded-t-lg relative group cursor-pointer`}
                        initial={{ height: 0 }}
                        animate={{ height: `${item.barHeight}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {/* Count label on bar */}
                        {item.count > 0 && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                              {item.count} student{item.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )}

                        {/* Percentage label inside bar (if tall enough) */}
                        {item.barHeight > 20 && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold drop-shadow">
                            {item.percentage.toFixed(0)}%
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* Labels below */}
                    <div className="mt-3 text-center">
                      <div className={`text-xl font-bold ${item.textColor} mb-1`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {item.range}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">
              Detailed Breakdown
            </h4>
            <div className="space-y-2">
              {enrichedDistribution.map((item, index) => (
                <motion.div
                  key={item.range}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between ${item.bgColor} rounded-lg p-3 border ${item.bgColor.replace('bg-', 'border-').replace('-50', '-200')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center text-white font-bold shadow-md`}>
                      {item.label}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.range}%
                      </div>
                      <div className="text-xs text-slate-600">
                        {item.count} student{item.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress bar */}
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                      />
                    </div>

                    <div className={`text-lg font-bold ${item.textColor} w-16 text-right`}>
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {(strugglingCount > 0 || stdDev > 15) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-amber-900 mb-1">
                    Insights & Recommendations
                  </h5>
                  <ul className="text-xs text-amber-800 space-y-1">
                    {strugglingCount > 0 && (
                      <li>
                        • {strugglingCount} student{strugglingCount !== 1 ? 's are' : ' is'} performing below 70% - consider targeted interventions
                      </li>
                    )}
                    {stdDev > 15 && (
                      <li>
                        • High standard deviation ({stdDev.toFixed(1)}%) indicates varied performance levels - differentiated instruction recommended
                      </li>
                    )}
                    {mean < 75 && (
                      <li>
                        • Class mean is below 75% - review recent material and consider additional practice opportunities
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
