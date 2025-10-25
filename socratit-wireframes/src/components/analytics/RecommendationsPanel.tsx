// ============================================================================
// RECOMMENDATIONS PANEL COMPONENT
// Batch 7: Display AI-generated recommendations with action items
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckSquare, Square, AlertCircle, Target, Brain, TrendingUp, Loader } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { RecommendationData } from '../../types/analytics.types';

interface RecommendationsPanelProps {
  data: RecommendationData | null;
  loading?: boolean;
  studentName?: string;
  onRefresh?: (focus?: 'concepts' | 'assignments' | 'engagement' | 'overall') => void;
  onActionComplete?: (actionId: string) => void;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  data,
  loading = false,
  studentName = 'Student',
  onRefresh,
  onActionComplete,
}) => {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [selectedFocus, setSelectedFocus] = useState<'concepts' | 'assignments' | 'engagement' | 'overall'>('overall');

  const handleActionToggle = (actionId: string) => {
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(actionId)) {
      newCompleted.delete(actionId);
    } else {
      newCompleted.add(actionId);
      onActionComplete?.(actionId);
    }
    setCompletedActions(newCompleted);
  };

  const handleFocusChange = (focus: 'concepts' | 'assignments' | 'engagement' | 'overall') => {
    setSelectedFocus(focus);
    onRefresh?.(focus);
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'error' as const };
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'warning' as const };
      case 'low':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'primary' as const };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'primary' as const };
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                AI-Powered Recommendations
              </h3>
              <p className="text-sm text-slate-600">
                Personalized insights for {studentName}
              </p>
            </div>
          </div>

          {/* Focus selector */}
          {onRefresh && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {(['overall', 'concepts', 'assignments', 'engagement'] as const).map((focus) => (
                  <button
                    key={focus}
                    onClick={() => handleFocusChange(focus)}
                    disabled={loading}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      selectedFocus === focus
                        ? 'bg-white text-brand-purple shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    } disabled:opacity-50`}
                  >
                    {focus.charAt(0).toUpperCase() + focus.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onRefresh(selectedFocus)}
                disabled={loading}
                className="px-3 py-1.5 bg-brand-purple text-white text-xs font-medium rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? (
                  <>
                    <Loader className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mb-4 animate-pulse">
                <Brain className="w-8 h-8" />
              </div>
              <p className="text-slate-700 font-medium">AI is analyzing performance data...</p>
              <p className="text-sm text-slate-500 mt-1">This may take a few moments</p>
            </motion.div>
          ) : !data ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200"
            >
              <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No recommendations available</p>
              <p className="text-sm text-slate-500 mt-1">
                Click "Generate" to get AI-powered insights
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Focus Area Badge */}
              {data.focus && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">Focus Area:</span>
                  <Badge variant="primary" size="sm">
                    {data.focus.charAt(0).toUpperCase() + data.focus.slice(1)}
                  </Badge>
                </div>
              )}

              {/* General Recommendations */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    Key Insights
                  </h4>
                  <div className="space-y-2">
                    {data.recommendations.map((recommendation, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <p className="text-sm text-slate-800 leading-relaxed flex-1">
                            {recommendation}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {data.actionItems && data.actionItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-brand-blue" />
                      Action Items
                    </h4>
                    <span className="text-xs text-slate-600">
                      {completedActions.size} of {data.actionItems.length} completed
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.actionItems.map((action, index) => {
                      const isCompleted = completedActions.has(action.id);
                      const colors = getPriorityColor(action.priority);

                      return (
                        <motion.div
                          key={action.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`rounded-lg p-4 border-2 transition-all ${
                            isCompleted
                              ? 'bg-green-50 border-green-200 opacity-75'
                              : `${colors.bg} ${colors.border}`
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleActionToggle(action.id)}
                              className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                            >
                              {isCompleted ? (
                                <CheckSquare className="w-5 h-5 text-green-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 hover:text-brand-blue" />
                              )}
                            </button>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className={`text-sm font-medium ${
                                  isCompleted ? 'text-green-800 line-through' : 'text-slate-900'
                                }`}>
                                  {action.title}
                                </p>
                                {!isCompleted && (
                                  <Badge variant={colors.badge} size="sm">
                                    {action.priority}
                                  </Badge>
                                )}
                              </div>

                              <p className={`text-xs leading-relaxed ${
                                isCompleted ? 'text-green-700' : 'text-slate-600'
                              }`}>
                                {action.description}
                              </p>

                              {action.estimatedImpact && !isCompleted && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-purple-700">
                                  <AlertCircle className="w-3 h-3" />
                                  <span className="font-medium">
                                    Expected impact: {action.estimatedImpact}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Progress Summary */}
              {data.actionItems && data.actionItems.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-700">Action Plan Progress</span>
                    <span className="text-xs font-bold text-brand-purple">
                      {((completedActions.size / data.actionItems.length) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-brand-purple to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedActions.size / data.actionItems.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* AI Attribution */}
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-slate-600">
                  Recommendations powered by OpenAI GPT-4
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
