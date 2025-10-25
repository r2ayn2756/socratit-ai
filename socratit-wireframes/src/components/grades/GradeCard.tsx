// ============================================================================
// GRADE CARD COMPONENT
// Display student's grade with breakdown and trends
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { LetterGradeBadge } from './LetterGradeBadge';
import { Grade, formatLetterGrade } from '../../types/grade.types';

interface GradeCardProps {
  grade: Grade;
  showDetails?: boolean;
  onClick?: () => void;
}

export const GradeCard: React.FC<GradeCardProps> = ({
  grade,
  showDetails = true,
  onClick,
}) => {
  const percentage = Math.round(grade.percentage * 10) / 10;
  const isExcellent = percentage >= 90;
  const isPassing = percentage >= 70;

  return (
    <Card
      variant="elevated"
      hover={!!onClick}
      onClick={onClick}
      className="group"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">
              {grade.assignment?.title || grade.categoryName || 'Overall Grade'}
            </h3>
            {grade.assignment && (
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(grade.gradeDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {grade.letterGrade && (
            <LetterGradeBadge grade={grade.letterGrade} size="md" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Score Display */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Score</span>
              <span className="text-2xl font-bold text-slate-900">
                {percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  isExcellent
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : isPassing
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600'
                }`}
              />
            </div>
          </div>

          {/* Points */}
          {showDetails && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-600 mb-1">Points Earned</div>
                <div className="text-xl font-bold text-slate-900">
                  {grade.pointsEarned}
                  <span className="text-sm text-slate-500 font-normal">
                    /{grade.pointsPossible}
                  </span>
                </div>
              </div>

              {grade.weightedScore !== undefined && grade.weightedScore !== null && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3">
                  <div className="text-xs text-purple-700 mb-1">Weighted</div>
                  <div className="text-xl font-bold text-purple-900">
                    {Math.round(grade.weightedScore * 10) / 10}%
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Adjustments */}
          {showDetails && (grade.extraCredit > 0 || grade.latePenalty > 0 || grade.curve !== 0) && (
            <div className="space-y-2 pt-4 border-t border-slate-200">
              {grade.extraCredit > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Extra Credit
                  </span>
                  <span className="font-semibold text-green-600">
                    +{grade.extraCredit}%
                  </span>
                </div>
              )}

              {grade.latePenalty > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-600">Late Penalty</span>
                  <span className="font-semibold text-orange-600">
                    -{grade.latePenalty}%
                  </span>
                </div>
              )}

              {grade.curve !== 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className={grade.curve > 0 ? 'text-blue-600' : 'text-slate-600'}>
                    Curve
                  </span>
                  <span className={`font-semibold ${grade.curve > 0 ? 'text-blue-600' : 'text-slate-600'}`}>
                    {grade.curve > 0 ? '+' : ''}{grade.curve}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dropped Indicator */}
          {grade.isDropped && (
            <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-3 text-center">
              <span className="text-sm text-slate-600 font-medium">
                This grade was dropped (lowest score)
              </span>
            </div>
          )}

          {/* Teacher Comments */}
          {grade.teacherComments && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-3">
              <div className="text-xs text-blue-700 font-semibold mb-1">
                Teacher Feedback
              </div>
              <p className="text-sm text-blue-900">{grade.teacherComments}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
