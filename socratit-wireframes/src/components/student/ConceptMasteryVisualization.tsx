// ============================================================================
// CONCEPT MASTERY VISUALIZATION
// Displays student's concept strengths and weaknesses from practice assignments
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, CheckCircle, AlertCircle, Clock, Award } from 'lucide-react';
import { Card, Badge } from '../common';

// ============================================================================
// TYPES
// ============================================================================

export interface ConceptMasteryData {
  conceptId: string;
  conceptName: string;
  subtopicName: string;
  unitTitle?: string;
  masteryScore: number; // 0-100
  questionsAttempted: number;
  questionsCorrect: number;
  averageScore: number;
  trend: 'improving' | 'declining' | 'stable';
  lastPracticed?: string; // ISO date
  difficulty?: 'easy' | 'medium' | 'hard';
  recommendations?: string[];
}

interface ConceptMasteryVisualizationProps {
  concepts: ConceptMasteryData[];
  studentId: string;
  classId: string;
  showRecommendations?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getMasteryLevel = (score: number): {
  label: string;
  color: string;
  icon: React.ReactNode;
} => {
  if (score >= 90) {
    return {
      label: 'Mastered',
      color: 'text-green-600 bg-green-100',
      icon: <CheckCircle className="w-4 h-4" />,
    };
  } else if (score >= 70) {
    return {
      label: 'Proficient',
      color: 'text-blue-600 bg-blue-100',
      icon: <Target className="w-4 h-4" />,
    };
  } else if (score >= 50) {
    return {
      label: 'Developing',
      color: 'text-amber-600 bg-amber-100',
      icon: <Clock className="w-4 h-4" />,
    };
  } else {
    return {
      label: 'Needs Practice',
      color: 'text-red-600 bg-red-100',
      icon: <AlertCircle className="w-4 h-4" />,
    };
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case 'declining':
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    default:
      return null;
  }
};

// ============================================================================
// CONCEPT MASTERY VISUALIZATION COMPONENT
// ============================================================================

export const ConceptMasteryVisualization: React.FC<ConceptMasteryVisualizationProps> = ({
  concepts,
  studentId,
  classId,
  showRecommendations = true,
}) => {
  // Sort concepts by mastery score (lowest first to highlight areas needing improvement)
  const sortedConcepts = [...concepts].sort((a, b) => a.masteryScore - b.masteryScore);

  // Calculate overall stats
  const averageMastery = concepts.length > 0
    ? Math.round(concepts.reduce((sum, c) => sum + c.masteryScore, 0) / concepts.length)
    : 0;

  const masteredConcepts = concepts.filter(c => c.masteryScore >= 90).length;
  const needsPractice = concepts.filter(c => c.masteryScore < 50).length;
  const improving = concepts.filter(c => c.trend === 'improving').length;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{averageMastery}%</div>
              <div className="text-xs text-slate-600">Average Mastery</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{masteredConcepts}</div>
              <div className="text-xs text-slate-600">Concepts Mastered</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{improving}</div>
              <div className="text-xs text-slate-600">Improving</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{needsPractice}</div>
              <div className="text-xs text-slate-600">Needs Practice</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Concept List */}
      <Card variant="glassElevated">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Concept Mastery Breakdown</h3>

        {concepts.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No concept data available yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Complete practice assignments to track your concept mastery
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedConcepts.map((concept, index) => {
              const mastery = getMasteryLevel(concept.masteryScore);

              return (
                <motion.div
                  key={concept.conceptId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-2 border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">{concept.conceptName}</h4>
                        {getTrendIcon(concept.trend)}
                      </div>
                      <p className="text-sm text-slate-600">
                        {concept.subtopicName}
                        {concept.unitTitle && ` • ${concept.unitTitle}`}
                      </p>
                    </div>

                    <Badge
                      variant={
                        concept.masteryScore >= 90
                          ? 'success'
                          : concept.masteryScore >= 70
                          ? 'primary'
                          : concept.masteryScore >= 50
                          ? 'warning'
                          : 'error'
                      }
                      size="sm"
                    >
                      <div className="flex items-center gap-1">
                        {mastery.icon}
                        {mastery.label}
                      </div>
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Mastery Score</span>
                      <span className="text-xs font-semibold text-slate-900">
                        {concept.masteryScore}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          concept.masteryScore >= 90
                            ? 'bg-green-500'
                            : concept.masteryScore >= 70
                            ? 'bg-blue-500'
                            : concept.masteryScore >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${concept.masteryScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center bg-slate-50 rounded-lg p-2">
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {concept.questionsAttempted}
                      </div>
                      <div className="text-xs text-slate-600">Attempted</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {concept.questionsCorrect}
                      </div>
                      <div className="text-xs text-slate-600">Correct</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {Math.round(concept.averageScore)}%
                      </div>
                      <div className="text-xs text-slate-600">Avg Score</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {showRecommendations && concept.recommendations && concept.recommendations.length > 0 && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        Recommendations:
                      </p>
                      <ul className="space-y-1">
                        {concept.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Focus Areas */}
      {needsPractice > 0 && (
        <Card variant="glassElevated">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            Priority Focus Areas
          </h3>
          <div className="space-y-2">
            {sortedConcepts
              .filter(c => c.masteryScore < 50)
              .slice(0, 5)
              .map((concept) => (
                <div
                  key={concept.conceptId}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-red-900">{concept.conceptName}</div>
                    <div className="text-sm text-red-700">{concept.subtopicName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{concept.masteryScore}%</div>
                    <div className="text-xs text-red-600">
                      {concept.questionsCorrect}/{concept.questionsAttempted} correct
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// COMPACT CONCEPT MASTERY CARD
// Smaller version for dashboard/overview
// ============================================================================

interface CompactConceptMasteryProps {
  concepts: ConceptMasteryData[];
  onViewDetails?: () => void;
}

export const CompactConceptMastery: React.FC<CompactConceptMasteryProps> = ({
  concepts,
  onViewDetails,
}) => {
  const averageMastery = concepts.length > 0
    ? Math.round(concepts.reduce((sum, c) => sum + c.masteryScore, 0) / concepts.length)
    : 0;

  const topStrengths = [...concepts]
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .slice(0, 3);

  const needsWork = [...concepts]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Concept Mastery</h3>
        <div className="text-2xl font-bold text-purple-600">{averageMastery}%</div>
      </div>

      <div className="space-y-4">
        {/* Strengths */}
        <div>
          <p className="text-xs font-semibold text-green-700 mb-2">Top Strengths</p>
          <div className="space-y-1">
            {topStrengths.map(concept => (
              <div key={concept.conceptId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 truncate">{concept.conceptName}</span>
                <span className="font-semibold text-green-600">{concept.masteryScore}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Areas to Improve */}
        {needsWork.length > 0 && needsWork[0].masteryScore < 70 && (
          <div>
            <p className="text-xs font-semibold text-red-700 mb-2">Needs Practice</p>
            <div className="space-y-1">
              {needsWork.map(concept => (
                <div key={concept.conceptId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{concept.conceptName}</span>
                  <span className="font-semibold text-red-600">{concept.masteryScore}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="mt-4 w-full text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          View Detailed Breakdown →
        </button>
      )}
    </Card>
  );
};
