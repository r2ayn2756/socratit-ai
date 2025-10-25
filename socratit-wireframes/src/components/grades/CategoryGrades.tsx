// ============================================================================
// CATEGORY GRADES COMPONENT
// Display grade breakdown by category with weights
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trophy } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { CategoryGrade } from '../../types/grade.types';

interface CategoryGradesProps {
  categoryGrades: CategoryGrade[];
  overallPercentage: number;
}

export const CategoryGrades: React.FC<CategoryGradesProps> = ({
  categoryGrades,
  overallPercentage,
}) => {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Grade Breakdown
              </h3>
              <p className="text-sm text-slate-600">
                By category with weights
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-600">Overall</div>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(overallPercentage * 10) / 10}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {categoryGrades.map((category, index) => (
            <motion.div
              key={category.categoryName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-50 rounded-xl p-4"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    {category.categoryName}
                  </div>
                  <div className="text-xs text-slate-500">
                    Weight: {category.weight}%
                    {category.dropLowest > 0 && (
                      <span className="ml-2 text-blue-600">
                        • Drops {category.dropLowest} lowest
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {Math.round(category.averagePercentage * 10) / 10}%
                  </div>
                  <div className="text-xs text-slate-500">
                    Weighted: {Math.round(category.weightedScore * 10) / 10}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white rounded-full h-2 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${category.averagePercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
                  className={`h-full rounded-full ${
                    category.averagePercentage >= 90
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : category.averagePercentage >= 80
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                      : category.averagePercentage >= 70
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}
                />
              </div>

              {/* Scores Count */}
              <div className="mt-2 text-xs text-slate-500">
                {category.scores.length} assignment{category.scores.length !== 1 ? 's' : ''}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Excellence Badge */}
        {overallPercentage >= 95 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: categoryGrades.length * 0.1 + 0.5, type: 'spring' }}
            className="mt-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-4 flex items-center gap-3 shadow-lg"
          >
            <Trophy className="w-8 h-8 text-yellow-900" />
            <div>
              <div className="font-bold text-yellow-900">
                Outstanding Performance!
              </div>
              <div className="text-sm text-yellow-800">
                You're excelling in this class
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
