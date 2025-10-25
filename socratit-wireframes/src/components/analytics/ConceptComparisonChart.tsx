// ============================================================================
// CONCEPT COMPARISON CHART COMPONENT
// Batch 7: Compare student concept mastery vs class average
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, Award, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { ConceptComparison } from '../../types/analytics.types';

interface ConceptComparisonChartProps {
  data: ConceptComparison[];
  title?: string;
  studentName?: string;
}

export const ConceptComparisonChart: React.FC<ConceptComparisonChartProps> = ({
  data,
  title = 'Concept Mastery Comparison',
  studentName = 'Student',
}) => {
  // Sort by percentile (lowest first to show struggling areas)
  const sortedData = [...data].sort((a, b) => a.percentile - b.percentile);

  // Calculate summary stats
  const avgStudentMastery = data.length > 0
    ? data.reduce((sum, item) => sum + item.studentMastery, 0) / data.length
    : 0;
  const avgClassAverage = data.length > 0
    ? data.reduce((sum, item) => sum + item.classAverage, 0) / data.length
    : 0;
  const aboveAverage = data.filter(item => item.studentMastery > item.classAverage).length;
  const belowAverage = data.filter(item => item.studentMastery < item.classAverage).length;
  const struggling = data.filter(item => item.percentile < 25).length;

  // Get color based on percentile
  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (percentile >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentile >= 25) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-purple to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">
                {data.length} concept{data.length !== 1 ? 's' : ''} tracked
              </p>
            </div>
          </div>

          {struggling > 0 && (
            <Badge variant="warning" size="sm">
              <AlertCircle className="w-3 h-3 mr-1" />
              {struggling} need{struggling !== 1 ? '' : 's'} attention
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="text-xs text-purple-700 font-medium mb-1">
                {studentName} Average
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {avgStudentMastery.toFixed(1)}%
              </div>
              <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                {avgStudentMastery > avgClassAverage ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    Above class average
                  </>
                ) : avgStudentMastery < avgClassAverage ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    Below class average
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3" />
                    At class average
                  </>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1">Class Average</div>
              <div className="text-2xl font-bold text-blue-900">
                {avgClassAverage.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Across all concepts
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Performance
              </div>
              <div className="text-2xl font-bold text-green-900">
                {aboveAverage}/{data.length}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Above class average
              </div>
            </div>
          </div>

          {/* Concept Comparison Bars */}
          {sortedData.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">
                Concept Mastery Details
              </h4>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {sortedData.map((item, index) => {
                  const maxValue = Math.max(item.studentMastery, item.classAverage, 100);
                  const studentWidth = (item.studentMastery / maxValue) * 100;
                  const classWidth = (item.classAverage / maxValue) * 100;
                  const isAboveAverage = item.studentMastery > item.classAverage;
                  const isBelowAverage = item.studentMastery < item.classAverage;

                  return (
                    <motion.div
                      key={item.concept}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white rounded-xl p-4 border-2 ${getPercentileColor(item.percentile)}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-semibold text-slate-900">
                              {item.concept}
                            </h5>
                            {getTrendIcon(item.trend)}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {item.percentile}th percentile
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAboveAverage && (
                            <Badge variant="success" size="sm">
                              +{(item.studentMastery - item.classAverage).toFixed(1)}%
                            </Badge>
                          )}
                          {isBelowAverage && (
                            <Badge variant="error" size="sm">
                              {(item.studentMastery - item.classAverage).toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Comparison Bars */}
                      <div className="space-y-2">
                        {/* Student Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-slate-700">{studentName}</span>
                            <span className="font-bold text-purple-600">
                              {item.studentMastery.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-brand-purple to-purple-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${studentWidth}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                            />
                          </div>
                        </div>

                        {/* Class Average Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-slate-700">Class Average</span>
                            <span className="font-bold text-blue-600">
                              {item.classAverage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-brand-blue to-blue-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${classWidth}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 + 0.1 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Trend indicator */}
                      {item.trend !== 'STABLE' && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-600">
                            {item.trend === 'IMPROVING' ? (
                              <span className="text-green-600 font-medium">
                                Mastery improving over time
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">
                                Mastery declining - needs attention
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No concept data available</p>
              <p className="text-sm text-slate-500 mt-1">
                Complete assignments to track concept mastery
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-brand-purple to-purple-600 rounded-full" />
              <span className="text-xs text-slate-600">{studentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-brand-blue to-blue-600 rounded-full" />
              <span className="text-xs text-slate-600">Class Average</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
