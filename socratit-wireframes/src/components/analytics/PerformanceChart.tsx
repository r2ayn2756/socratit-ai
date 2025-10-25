// ============================================================================
// PERFORMANCE CHART COMPONENT
// Display student performance trends over time with line chart
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, Award } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';

interface PerformanceDataPoint {
  date: string;
  score: number;
  assignmentTitle?: string;
  categoryName?: string;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  title?: string;
  showTrend?: boolean;
  showAverage?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  title = 'Performance Over Time',
  showTrend = true,
  showAverage = true,
}) => {
  // Sort data by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate statistics
  const scores = sortedData.map(d => d.score);
  const average = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  const latest = scores.length > 0 ? scores[scores.length - 1] : 0;
  const previous = scores.length > 1 ? scores[scores.length - 2] : latest;
  const trend = latest - previous;
  const isImproving = trend > 0;
  const isStable = trend === 0;

  // Find min/max for chart scaling
  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, 100);
  const range = maxScore - minScore;

  // Generate SVG path for line chart
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = 20;
  const effectiveWidth = chartWidth - 2 * padding;
  const effectiveHeight = chartHeight - 2 * padding;

  const getX = (index: number) => {
    return padding + (index / Math.max(sortedData.length - 1, 1)) * effectiveWidth;
  };

  const getY = (score: number) => {
    const normalized = range > 0 ? (score - minScore) / range : 0.5;
    return chartHeight - padding - normalized * effectiveHeight;
  };

  // Create SVG path
  const linePath = sortedData.length > 0
    ? sortedData
        .map((point, index) => {
          const x = getX(index);
          const y = getY(point.score);
          return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ')
    : '';

  // Average line path
  const avgY = getY(average);
  const avgPath = `M ${padding} ${avgY} L ${chartWidth - padding} ${avgY}`;

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">
                {sortedData.length} assignment{sortedData.length !== 1 ? 's' : ''} tracked
              </p>
            </div>
          </div>

          {showTrend && sortedData.length > 1 && (
            <div className="flex items-center gap-2">
              {isImproving ? (
                <>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <Badge variant="success" size="sm">
                    +{Math.abs(trend).toFixed(1)}%
                  </Badge>
                </>
              ) : isStable ? (
                <Badge variant="primary" size="sm">
                  Stable
                </Badge>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <Badge variant="error" size="sm">
                    {trend.toFixed(1)}%
                  </Badge>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1">Latest Score</div>
              <div className="text-2xl font-bold text-blue-900">
                {latest.toFixed(1)}%
              </div>
            </div>

            {showAverage && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
                <div className="text-xs text-purple-700 font-medium mb-1">Average</div>
                <div className="text-2xl font-bold text-purple-900">
                  {average.toFixed(1)}%
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
              <div className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Best Score
              </div>
              <div className="text-2xl font-bold text-green-900">
                {Math.max(...scores, 0).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Chart */}
          {sortedData.length > 0 ? (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid lines */}
                <g className="grid-lines">
                  {[0, 25, 50, 75, 100].map(score => {
                    const y = getY(score);
                    return (
                      <g key={score}>
                        <line
                          x1={padding}
                          y1={y}
                          x2={chartWidth - padding}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padding - 8}
                          y={y + 4}
                          fontSize="10"
                          fill="#64748b"
                          textAnchor="end"
                        >
                          {score}%
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Average line */}
                {showAverage && (
                  <motion.path
                    d={avgPath}
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                )}

                {/* Main line */}
                <motion.path
                  d={linePath}
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />

                {/* Area under curve */}
                <motion.path
                  d={`${linePath} L ${getX(sortedData.length - 1)} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
                  fill="url(#areaGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />

                {/* Data points */}
                {sortedData.map((point, index) => {
                  const x = getX(index);
                  const y = getY(point.score);
                  return (
                    <motion.g
                      key={index}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="white"
                        stroke="#6366f1"
                        strokeWidth="2"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        fill="transparent"
                        className="hover:fill-indigo-100 transition-colors cursor-pointer"
                      >
                        <title>
                          {point.assignmentTitle || 'Assignment'}: {point.score.toFixed(1)}%
                          {point.date && ` - ${new Date(point.date).toLocaleDateString()}`}
                        </title>
                      </circle>
                    </motion.g>
                  );
                })}

                {/* Gradients */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No performance data yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Complete assignments to see performance trends
              </p>
            </div>
          )}

          {/* Recent assignments list */}
          {sortedData.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Recent Assignments
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sortedData.slice(-5).reverse().map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {point.assignmentTitle || 'Assignment'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(point.date).toLocaleDateString()}
                        {point.categoryName && (
                          <>
                            <span>•</span>
                            <span>{point.categoryName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-indigo-600">
                      {point.score.toFixed(1)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
