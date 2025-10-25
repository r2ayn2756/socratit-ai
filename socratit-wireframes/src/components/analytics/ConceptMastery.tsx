// ============================================================================
// CONCEPT MASTERY COMPONENT
// Display student's concept mastery with visual indicators
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import {
  ConceptMastery as ConceptMasteryType,
  getMasteryColor,
  formatMasteryLevel,
  MasteryLevel,
  TrendDirection,
} from '../../types/analytics.types';

// Simplified concept type for display
interface ConceptDisplay {
  id?: string;
  concept: string;
  masteryLevel: MasteryLevel;
  masteryPercent: number;
  totalAttempts?: number;
  correctAttempts?: number;
  trend?: TrendDirection;
  subject?: string;
  lastAssessed?: string;
}

interface ConceptMasteryProps {
  concepts: (ConceptMasteryType | ConceptDisplay)[];
  title?: string;
  showTrends?: boolean;
}

export const ConceptMastery: React.FC<ConceptMasteryProps> = ({
  concepts,
  title = 'Concept Mastery',
  showTrends = true,
}) => {
  // Sort by mastery percent (lowest first to show areas needing improvement)
  const sortedConcepts = [...concepts].sort(
    (a, b) => a.masteryPercent - b.masteryPercent
  );

  const getMasteryColorClass = (percent: number) => {
    if (percent >= 90) return 'from-green-500 to-green-600';
    if (percent >= 70) return 'from-blue-500 to-blue-600';
    if (percent >= 40) return 'from-yellow-500 to-yellow-600';
    if (percent > 0) return 'from-orange-500 to-orange-600';
    return 'from-slate-400 to-slate-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'DECLINING':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">
              {concepts.length} concept{concepts.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {sortedConcepts.map((concept, index) => (
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
            >
              {/* Concept Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 capitalize">
                    {concept.concept}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {concept.correctAttempts}/{concept.totalAttempts} correct
                    {concept.subject && ` • ${concept.subject}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {showTrends && concept.trend && (
                    <div className="flex items-center">
                      {getTrendIcon(concept.trend)}
                    </div>
                  )}
                  <Badge
                    variant={
                      concept.masteryLevel === 'MASTERED'
                        ? 'success'
                        : concept.masteryLevel === 'PROFICIENT'
                        ? 'primary'
                        : concept.masteryLevel === 'DEVELOPING'
                        ? 'warning'
                        : 'error'
                    }
                    size="sm"
                  >
                    {formatMasteryLevel(concept.masteryLevel)}
                  </Badge>
                </div>
              </div>

              {/* Mastery Progress Bar */}
              <div className="relative">
                <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${concept.masteryPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 + 0.2 }}
                    className={`h-full bg-gradient-to-r ${getMasteryColorClass(
                      concept.masteryPercent
                    )}`}
                  />
                </div>

                {/* Percentage Label */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <span className="text-xs font-bold text-slate-700">
                    {Math.round(concept.masteryPercent)}%
                  </span>
                </div>
              </div>

              {/* Last Assessed */}
              {concept.lastAssessed && (
                <div className="mt-2 text-xs text-slate-400">
                  Last assessed:{' '}
                  {new Date(concept.lastAssessed).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          ))}

          {concepts.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">
                No concepts tracked yet
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Complete assignments to see concept mastery
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
