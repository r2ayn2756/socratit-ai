// ============================================================================
// STUDENT PROGRESS DASHBOARD
// Comprehensive view of student's curriculum progress
// ============================================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GlassCard, GlassPanel } from './GlassCard';
import { ProgressBar, CircularProgress } from './ProgressBar';
import { CompactUnitCard } from './UnitCard';
import type { StudentUnitProgressResponse } from '../../types/curriculum.types';
import curriculumApi from '../../services/curriculumApi.service';
import { format } from 'date-fns';

interface StudentProgressDashboardProps {
  scheduleId: string;
  onUnitClick?: (unitId: string) => void;
}

export const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = ({
  scheduleId,
  onUnitClick,
}) => {
  const [progress, setProgress] = useState<StudentUnitProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [scheduleId]);

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      const data = await curriculumApi.progress.getMyProgress(scheduleId);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">No progress data available</p>
      </div>
    );
  }

  const { overallProgress, unitProgress, insights } = progress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {progress.scheduleTitle}
        </h1>
        <p className="text-gray-600">Your Year-Long Progress</p>
      </div>

      {/* Overall Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Completion */}
        <GlassCard variant="elevated" padding="md" glow glowColor="blue">
          <div className="text-center">
            <CircularProgress
              progress={overallProgress.percentComplete}
              size={100}
              color="blue"
              showPercentage
              label="Complete"
            />
            <p className="mt-3 text-sm font-medium text-gray-600">
              Overall Progress
            </p>
          </div>
        </GlassCard>

        {/* Units Stats */}
        <GlassCard variant="default" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {overallProgress.unitsCompleted}/{overallProgress.totalUnits}
              </p>
              <p className="text-sm text-gray-600">Units Completed</p>
            </div>
          </div>
        </GlassCard>

        {/* Mastered Units */}
        <GlassCard variant="default" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {overallProgress.unitsMastered}
              </p>
              <p className="text-sm text-gray-600">Units Mastered</p>
            </div>
          </div>
        </GlassCard>

        {/* Average Score */}
        <GlassCard variant="default" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(overallProgress.averageScore)}%
              </p>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Current Unit Focus */}
      {overallProgress.currentUnitId && (
        <GlassPanel title="Current Unit" subtitle="Focus on this unit now">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                {unitProgress.find((u) => u.unitId === overallProgress.currentUnitId)?.unitNumber}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {overallProgress.currentUnitTitle}
                </h3>
                <p className="text-gray-600">Keep up the great work!</p>
              </div>
            </div>

            {unitProgress
              .filter((u) => u.unitId === overallProgress.currentUnitId)
              .map((unit) => (
                <div key={unit.unitId} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <ProgressBar
                      progress={unit.percentComplete}
                      label="Unit Progress"
                      showPercentage
                      color="blue"
                      animated
                    />
                  </div>
                  <div>
                    <ProgressBar
                      progress={(unit.assignmentsCompleted / unit.assignmentsTotal) * 100}
                      label={`Assignments (${unit.assignmentsCompleted}/${unit.assignmentsTotal})`}
                      showPercentage
                      color="green"
                      animated
                    />
                  </div>
                  <div>
                    <ProgressBar
                      progress={unit.masteryPercentage}
                      label="Mastery"
                      showPercentage
                      color="purple"
                      animated
                    />
                  </div>
                </div>
              ))}
          </div>
        </GlassPanel>
      )}

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Strengths */}
        <GlassCard variant="default" padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Your Strengths</h3>
          </div>
          {insights.strengths.length > 0 ? (
            <div className="space-y-2">
              {insights.strengths.slice(0, 5).map((strength, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Complete more assignments to identify your strengths
            </p>
          )}
        </GlassCard>

        {/* Struggles */}
        <GlassCard variant="default" padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Areas to Improve</h3>
          </div>
          {insights.struggles.length > 0 ? (
            <div className="space-y-2">
              {insights.struggles.slice(0, 5).map((struggle, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{struggle}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No struggles identified yet</p>
          )}
        </GlassCard>

        {/* Recommended Review */}
        <GlassCard variant="default" padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Recommended Review</h3>
          </div>
          {insights.recommendedReview.length > 0 ? (
            <div className="space-y-2">
              {insights.recommendedReview.slice(0, 5).map((topic, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg"
                >
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              You're doing great! No additional review needed
            </p>
          )}
        </GlassCard>
      </div>

      {/* All Units Progress */}
      <GlassPanel
        title="All Units"
        subtitle={`${unitProgress.length} units in your curriculum`}
      >
        <div className="space-y-4">
          {unitProgress.map((unit, idx) => (
            <motion.div
              key={unit.unitId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard
                variant="default"
                padding="md"
                hover
                onClick={() => onUnitClick?.(unit.unitId)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Unit Number Badge */}
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      font-bold text-white shadow-md
                      ${
                        unit.status === 'MASTERED'
                          ? 'bg-green-500'
                          : unit.status === 'COMPLETED'
                          ? 'bg-blue-500'
                          : unit.status === 'IN_PROGRESS'
                          ? 'bg-orange-500'
                          : 'bg-gray-400'
                      }
                    `}
                  >
                    {unit.unitNumber}
                  </div>

                  {/* Unit Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">
                      {unit.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {format(new Date(unit.startDate), 'MMM d')} -{' '}
                      {format(new Date(unit.endDate), 'MMM d')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <ProgressBar
                        progress={unit.percentComplete}
                        size="sm"
                        color={
                          unit.percentComplete >= 90
                            ? 'green'
                            : unit.percentComplete >= 50
                            ? 'blue'
                            : 'orange'
                        }
                      />
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>
                          {unit.assignmentsCompleted}/{unit.assignmentsTotal} assignments
                        </span>
                        <span>{Math.round(unit.assignmentsScore)}% avg</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`
                      px-3 py-1 rounded-lg text-xs font-semibold
                      ${
                        unit.status === 'MASTERED'
                          ? 'bg-green-100 text-green-700'
                          : unit.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-700'
                          : unit.status === 'IN_PROGRESS'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {unit.status.replace('_', ' ')}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
};

export default StudentProgressDashboard;
