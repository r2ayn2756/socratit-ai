// ============================================================================
// CLASS OVERVIEW COMPONENT
// Display comprehensive class analytics with key metrics and insights
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Award,
  AlertTriangle,
  BookOpen,
  Target,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { ClassOverview as ClassOverviewType } from '../../types/analytics.types';

interface ClassOverviewProps {
  overview: ClassOverviewType;
  title?: string;
}

export const ClassOverview: React.FC<ClassOverviewProps> = ({
  overview,
  title = 'Class Overview',
}) => {
  const {
    totalStudents,
    averageGrade,
    passingRate,
    strugglingCount,
    improvingCount,
    decliningCount,
    averageCompletionRate,
    topConcepts,
    strugglingConcepts,
  } = overview;

  // Calculate performance indicators
  const isHealthy = passingRate >= 80 && strugglingCount <= totalStudents * 0.2;
  const needsAttention = strugglingCount > totalStudents * 0.3;

  const stats = [
    {
      icon: Users,
      label: 'Total Students',
      value: totalStudents,
      color: 'blue',
      bgClass: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: Award,
      label: 'Average Grade',
      value: `${averageGrade.toFixed(1)}%`,
      color: 'purple',
      bgClass: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: CheckCircle,
      label: 'Passing Rate',
      value: `${passingRate.toFixed(0)}%`,
      color: 'green',
      bgClass: 'from-green-500 to-green-600',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Target,
      label: 'Completion Rate',
      value: `${averageCompletionRate.toFixed(0)}%`,
      color: 'cyan',
      bgClass: 'from-cyan-500 to-cyan-600',
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
  ];

  const trends = [
    {
      icon: TrendingUp,
      label: 'Improving',
      count: improvingCount,
      color: 'green',
      bgClass: 'from-green-50 to-green-100',
      borderClass: 'border-green-200',
      textClass: 'text-green-900',
      iconClass: 'text-green-600',
    },
    {
      icon: AlertTriangle,
      label: 'Struggling',
      count: strugglingCount,
      color: 'orange',
      bgClass: 'from-orange-50 to-orange-100',
      borderClass: 'border-orange-200',
      textClass: 'text-orange-900',
      iconClass: 'text-orange-600',
    },
    {
      icon: TrendingUp,
      label: 'Declining',
      count: decliningCount,
      color: 'red',
      bgClass: 'from-red-50 to-red-100',
      borderClass: 'border-red-200',
      textClass: 'text-red-900',
      iconClass: 'text-red-600',
      rotate: true,
    },
  ];

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">Real-time class analytics</p>
            </div>
          </div>

          {/* Health Indicator */}
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Healthy
              </div>
            ) : needsAttention ? (
              <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Needs Attention
              </div>
            ) : (
              <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                Monitor
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Main Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden"
              >
                <div className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-slate-300 transition-colors">
                  <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Student Trends */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Student Performance Trends
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {trends.map((trend, index) => (
                <motion.div
                  key={trend.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`bg-gradient-to-br ${trend.bgClass} rounded-xl p-4 border-2 ${trend.borderClass}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <trend.icon
                      className={`w-4 h-4 ${trend.iconClass} ${
                        trend.rotate ? 'rotate-180' : ''
                      }`}
                    />
                    <span className={`text-xs font-medium ${trend.iconClass}`}>
                      {trend.label}
                    </span>
                  </div>
                  <div className={`text-3xl font-bold ${trend.textClass}`}>
                    {trend.count}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {totalStudents > 0
                      ? `${((trend.count / totalStudents) * 100).toFixed(0)}% of class`
                      : '0% of class'}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Concept Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            {/* Top Concepts */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                Strong Concepts
              </h4>
              {topConcepts && topConcepts.length > 0 ? (
                <div className="space-y-2">
                  {topConcepts.slice(0, 5).map((concept: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="bg-gradient-to-r from-green-50 to-transparent rounded-lg p-3 border border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 capitalize">
                          {concept.concept}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-white rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-600"
                              style={{ width: `${concept.averageMastery}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-green-700 w-10 text-right">
                            {concept.averageMastery.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">No concept data yet</p>
                </div>
              )}
            </div>

            {/* Struggling Concepts */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Needs Improvement
              </h4>
              {strugglingConcepts && strugglingConcepts.length > 0 ? (
                <div className="space-y-2">
                  {strugglingConcepts.slice(0, 5).map((concept: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="bg-gradient-to-r from-orange-50 to-transparent rounded-lg p-3 border border-orange-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 capitalize">
                          {concept.concept}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-white rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                              style={{ width: `${concept.averageMastery}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-orange-700 w-10 text-right">
                            {concept.averageMastery.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">All concepts strong!</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Recommendations */}
          {(needsAttention || strugglingCount > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-blue-900 mb-2">
                    Recommended Actions
                  </h5>
                  <ul className="space-y-1 text-sm text-blue-800">
                    {strugglingCount > totalStudents * 0.3 && (
                      <li>• Review teaching approach for struggling concepts</li>
                    )}
                    {passingRate < 70 && (
                      <li>• Consider additional practice assignments</li>
                    )}
                    {strugglingCount > 0 && (
                      <li>• Schedule one-on-one sessions with struggling students</li>
                    )}
                    {averageCompletionRate < 80 && (
                      <li>• Send reminders about incomplete assignments</li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
