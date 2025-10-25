// ============================================================================
// STUDENT PROGRESS DASHBOARD COMPONENT
// Overview dashboard showing completion rate, grades, trends, and velocity
// ============================================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Clock, Target, Award, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { StatCard } from '../common/StatCard';
import { getStudentProgress } from '../../services/progress.service';
import { StudentProgress } from '../../types/progress.types';

interface StudentProgressDashboardProps {
  studentId: string;
  classId: string;
  className?: string;
}

export const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = ({
  studentId,
  classId,
  className = '',
}) => {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [studentId, classId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentProgress(studentId, classId);
      setProgress(data);
    } catch (err: any) {
      console.error('Error loading student progress:', err);
      setError(err.response?.data?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProgress();
    setRefreshing(false);
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'IMPROVING':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'DECLINING':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTrendColorClass = (direction: string) => {
    switch (direction) {
      case 'IMPROVING':
        return 'text-green-600 bg-green-50';
      case 'DECLINING':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-slate-600">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Progress</h3>
              <p className="text-sm text-slate-600 mb-4">{error}</p>
              <button
                onClick={loadProgress}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">My Progress</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold text-slate-900">
                  {progress.completionRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">Completion Rate</p>
              <p className="text-xs text-slate-500">
                {progress.completedAssignments} of {progress.totalAssignments} assignments
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average Grade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {progress.averageGrade !== null
                      ? progress.averageGrade.toFixed(1)
                      : 'N/A'}
                  </span>
                  {progress.averageGrade !== null && (
                    <div
                      className={`p-1.5 rounded-lg ${getTrendColorClass(progress.trendDirection)}`}
                    >
                      {getTrendIcon(progress.trendDirection)}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">Average Grade</p>
              {progress.trendPercentage !== null && (
                <p
                  className={`text-xs font-medium ${
                    progress.trendDirection === 'IMPROVING'
                      ? 'text-green-600'
                      : progress.trendDirection === 'DECLINING'
                      ? 'text-red-600'
                      : 'text-slate-500'
                  }`}
                >
                  {progress.trendPercentage > 0 ? '+' : ''}
                  {progress.trendPercentage.toFixed(1)}% trend
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Time Spent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold text-slate-900">
                  {formatTime(progress.totalTimeSpent).split(' ')[0]}
                  <span className="text-lg font-normal text-slate-600">
                    {formatTime(progress.totalTimeSpent).split(' ')[1] || ''}
                  </span>
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">Total Time Spent</p>
              {progress.averageTimePerAssignment && (
                <p className="text-xs text-slate-500">
                  {progress.averageTimePerAssignment.toFixed(0)} min avg per assignment
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning Velocity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold text-slate-900">
                  {progress.learningVelocity.toFixed(1)}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">Learning Velocity</p>
              <p className="text-xs text-slate-500">assignments per week</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Assignment Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="elevated">
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Assignment Status</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Completed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">Completed</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {progress.completedAssignments}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(progress.completedAssignments / progress.totalAssignments) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* In Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">In Progress</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {progress.inProgressAssignments}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(progress.inProgressAssignments / progress.totalAssignments) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Not Started */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">Not Started</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {progress.notStartedAssignments}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-slate-400 to-slate-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(progress.notStartedAssignments / progress.totalAssignments) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Last Updated */}
      <p className="text-xs text-slate-500 text-center">
        Last updated: {new Date(progress.lastCalculated).toLocaleString()}
      </p>
    </div>
  );
};
