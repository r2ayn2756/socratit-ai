// ============================================================================
// PERFORMANCE TIMELINE CHART COMPONENT
// Batch 7: Enhanced performance timeline with time spent and assignment count
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, Clock, FileText, Activity } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { TimelineDataPoint } from '../../types/analytics.types';
import { formatTimeSpent } from '../../types/analytics.types';

interface PerformanceTimelineChartProps {
  data: TimelineDataPoint[];
  title?: string;
  granularity: 'day' | 'week' | 'month';
  onGranularityChange?: (granularity: 'day' | 'week' | 'month') => void;
}

export const PerformanceTimelineChart: React.FC<PerformanceTimelineChartProps> = ({
  data,
  title = 'Performance Timeline',
  granularity,
  onGranularityChange,
}) => {
  const [activeMetric, setActiveMetric] = useState<'score' | 'timeSpent' | 'assignments'>('score');

  // Sort data by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate statistics
  const scores = sortedData.map(d => d.averageScore);
  const totalAssignments = sortedData.reduce((sum, d) => sum + d.assignmentCount, 0);
  const totalTimeSpent = sortedData.reduce((sum, d) => sum + d.timeSpent, 0);
  const avgScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  const latest = scores.length > 0 ? scores[scores.length - 1] : 0;
  const previous = scores.length > 1 ? scores[scores.length - 2] : latest;
  const trend = latest - previous;
  const isImproving = trend > 0;

  // Chart dimensions
  const chartWidth = 700;
  const chartHeight = 250;
  const padding = 40;
  const effectiveWidth = chartWidth - 2 * padding;
  const effectiveHeight = chartHeight - 2 * padding;

  // Get metric value for chart
  const getMetricValue = (point: TimelineDataPoint) => {
    switch (activeMetric) {
      case 'score':
        return point.averageScore;
      case 'timeSpent':
        return point.timeSpent / 3600; // Convert to hours for visualization
      case 'assignments':
        return point.assignmentCount;
    }
  };

  // Find min/max for chart scaling
  const metricValues = sortedData.map(getMetricValue);
  const minValue = Math.min(...metricValues, 0);
  const maxValue = Math.max(...metricValues, activeMetric === 'score' ? 100 : Math.max(...metricValues) * 1.2);
  const range = maxValue - minValue;

  const getX = (index: number) => {
    return padding + (index / Math.max(sortedData.length - 1, 1)) * effectiveWidth;
  };

  const getY = (value: number) => {
    const normalized = range > 0 ? (value - minValue) / range : 0.5;
    return chartHeight - padding - normalized * effectiveHeight;
  };

  // Create SVG path
  const linePath = sortedData.length > 0
    ? sortedData
        .map((point, index) => {
          const x = getX(index);
          const y = getY(getMetricValue(point));
          return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ')
    : '';

  // Format date based on granularity
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (granularity) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">
                {sortedData.length} {granularity === 'day' ? 'days' : granularity === 'week' ? 'weeks' : 'months'} tracked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Granularity selector */}
            {onGranularityChange && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {(['day', 'week', 'month'] as const).map((gran) => (
                  <button
                    key={gran}
                    onClick={() => onGranularityChange(gran)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      granularity === gran
                        ? 'bg-white text-brand-blue shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {gran.charAt(0).toUpperCase() + gran.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Trend indicator */}
            {sortedData.length > 1 && (
              <div className="flex items-center gap-2">
                {isImproving ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <Badge variant="success" size="sm">
                      +{Math.abs(trend).toFixed(1)}%
                    </Badge>
                  </>
                ) : trend === 0 ? (
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
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-4 gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
                activeMetric === 'score'
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md'
                  : 'bg-white border-slate-200 hover:border-blue-200'
              }`}
              onClick={() => setActiveMetric('score')}
            >
              <div className="flex items-center gap-2 text-xs text-blue-700 font-medium mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                Average Score
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {avgScore.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Latest: {latest.toFixed(1)}%
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
                activeMetric === 'timeSpent'
                  ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-md'
                  : 'bg-white border-slate-200 hover:border-purple-200'
              }`}
              onClick={() => setActiveMetric('timeSpent')}
            >
              <div className="flex items-center gap-2 text-xs text-purple-700 font-medium mb-2">
                <Clock className="w-3.5 h-3.5" />
                Time Spent
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatTimeSpent(totalTimeSpent)}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                Total study time
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
                activeMetric === 'assignments'
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-md'
                  : 'bg-white border-slate-200 hover:border-green-200'
              }`}
              onClick={() => setActiveMetric('assignments')}
            >
              <div className="flex items-center gap-2 text-xs text-green-700 font-medium mb-2">
                <FileText className="w-3.5 h-3.5" />
                Assignments
              </div>
              <div className="text-2xl font-bold text-green-900">
                {totalAssignments}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Completed
              </div>
            </motion.div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
              <div className="flex items-center gap-2 text-xs text-orange-700 font-medium mb-2">
                <Activity className="w-3.5 h-3.5" />
                Best Score
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {Math.max(...scores, 0).toFixed(1)}%
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Peak performance
              </div>
            </div>
          </div>

          {/* Chart */}
          {sortedData.length > 0 ? (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700">
                  Showing:{' '}
                  <span className="text-brand-blue">
                    {activeMetric === 'score' && 'Average Score'}
                    {activeMetric === 'timeSpent' && 'Time Spent (hours)'}
                    {activeMetric === 'assignments' && 'Assignment Count'}
                  </span>
                </p>
              </div>

              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid lines */}
                <g className="grid-lines">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const value = minValue + (range * i) / 4;
                    const y = getY(value);
                    return (
                      <g key={i}>
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
                          {activeMetric === 'score' ? `${value.toFixed(0)}%` : value.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* Main line */}
                <motion.path
                  d={linePath}
                  stroke="url(#timelineGradient)"
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
                  fill="url(#timelineAreaGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />

                {/* Data points */}
                {sortedData.map((point, index) => {
                  const x = getX(index);
                  const y = getY(getMetricValue(point));
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
                        r="6"
                        fill="white"
                        stroke="#155dfc"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="10"
                        fill="transparent"
                        className="hover:fill-blue-100 transition-colors cursor-pointer"
                      >
                        <title>
                          {formatDate(point.date)}
                          {'\n'}Score: {point.averageScore.toFixed(1)}%
                          {'\n'}Assignments: {point.assignmentCount}
                          {'\n'}Time: {formatTimeSpent(point.timeSpent)}
                        </title>
                      </circle>
                    </motion.g>
                  );
                })}

                {/* X-axis labels */}
                {sortedData.map((point, index) => {
                  if (index % Math.ceil(sortedData.length / 8) !== 0 && index !== sortedData.length - 1) {
                    return null;
                  }
                  const x = getX(index);
                  return (
                    <text
                      key={`label-${index}`}
                      x={x}
                      y={chartHeight - padding + 20}
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      {formatDate(point.date)}
                    </text>
                  );
                })}

                {/* Gradients */}
                <defs>
                  <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#155dfc" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="timelineAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#155dfc" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No timeline data available</p>
              <p className="text-sm text-slate-500 mt-1">
                Complete assignments to see performance trends over time
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
