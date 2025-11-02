// ============================================================================
// PROGRESS SECTION COMPONENT
// Displays class progress overview in dashboard
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Award } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../common/Button';
import { CircularProgress } from '../curriculum/ProgressBar';

interface ProgressData {
  classAverage: number;
  averageTrend: 'up' | 'down' | 'stable';
  strugglingStudents: Array<{
    id: string;
    name: string;
    averageScore: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    averageScore: number;
  }>;
}

interface ProgressSectionProps {
  progressData: ProgressData;
  onViewAnalytics?: () => void;
  onStudentClick?: (studentId: string) => void;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  progressData,
  onViewAnalytics,
  onStudentClick,
}) => {
  const getTrendIcon = () => {
    if (progressData.averageTrend === 'up') {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else if (progressData.averageTrend === 'down') {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (progressData.averageTrend === 'up') return 'text-green-600';
    if (progressData.averageTrend === 'down') return 'text-red-600';
    return 'text-neutral-600';
  };

  return (
    <CollapsibleSection
      title="Progress Overview"
      subtitle="Class performance insights"
      icon={<TrendingUp className="w-5 h-5 text-white" />}
      defaultExpanded={false}
      action={
        onViewAnalytics && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAnalytics}
          >
            View Analytics
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Class Average */}
        <div className="flex items-center gap-6">
          <CircularProgress
            progress={progressData.classAverage}
            size={100}
            color={progressData.classAverage >= 70 ? 'green' : 'orange'}
            showPercentage
            label="Class Avg"
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-semibold text-neutral-900">
                Class Average
              </h4>
              {getTrendIcon()}
            </div>
            <p className={`text-sm ${getTrendColor()}`}>
              {progressData.averageTrend === 'up' && 'Trending upward'}
              {progressData.averageTrend === 'down' && 'Trending downward'}
              {progressData.averageTrend === 'stable' && 'Stable performance'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Struggling Students */}
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-neutral-900">
                Needs Support
              </h4>
            </div>

            {progressData.strugglingStudents.length === 0 ? (
              <p className="text-sm text-neutral-600">
                All students on track
              </p>
            ) : (
              <div className="space-y-2">
                {progressData.strugglingStudents.slice(0, 3).map((student) => (
                  <motion.button
                    key={student.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onStudentClick?.(student.id)}
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {student.name}
                      </p>
                      <span className="text-sm font-semibold text-orange-600">
                        {student.averageScore}%
                      </span>
                    </div>
                  </motion.button>
                ))}
                {progressData.strugglingStudents.length > 3 && (
                  <p className="text-xs text-neutral-600 text-center pt-1">
                    + {progressData.strugglingStudents.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Top Performers */}
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-neutral-900">
                Top Performers
              </h4>
            </div>

            {progressData.topPerformers.length === 0 ? (
              <p className="text-sm text-neutral-600">
                No data yet
              </p>
            ) : (
              <div className="space-y-2">
                {progressData.topPerformers.slice(0, 3).map((student, index) => (
                  <motion.button
                    key={student.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onStudentClick?.(student.id)}
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <span className="text-xs font-bold text-green-600">
                            #{index + 1}
                          </span>
                        )}
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {student.name}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {student.averageScore}%
                      </span>
                    </div>
                  </motion.button>
                ))}
                {progressData.topPerformers.length > 3 && (
                  <p className="text-xs text-neutral-600 text-center pt-1">
                    + {progressData.topPerformers.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default ProgressSection;
