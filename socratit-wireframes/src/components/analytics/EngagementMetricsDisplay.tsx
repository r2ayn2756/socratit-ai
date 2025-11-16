// ============================================================================
// ENGAGEMENT METRICS DISPLAY COMPONENT
// Batch 7: Display student engagement statistics (time, completion, activity)
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { EngagementMetrics } from '../../types/analytics.types';

interface EngagementMetricsDisplayProps {
  data: EngagementMetrics;
  title?: string;
}

export const EngagementMetricsDisplay: React.FC<EngagementMetricsDisplayProps> = ({
  data,
  title = 'Class Engagement Metrics',
}) => {
  const {
    completionRate,
    activeStudents,
    inactiveStudents,
    totalStudents,
  } = data;

  // Calculate percentages
  const activePercentage = totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0;
  const inactivePercentage = totalStudents > 0 ? (inactiveStudents / totalStudents) * 100 : 0;

  // Determine engagement health
  const getEngagementHealth = () => {
    if (activePercentage >= 80 && completionRate >= 80) {
      return { status: 'Excellent', color: 'green', icon: TrendingUp };
    } else if (activePercentage >= 60 && completionRate >= 60) {
      return { status: 'Good', color: 'blue', icon: Activity };
    } else if (activePercentage >= 40 && completionRate >= 40) {
      return { status: 'Fair', color: 'yellow', icon: Activity };
    } else {
      return { status: 'Needs Attention', color: 'red', icon: UserX };
    }
  };

  const health = getEngagementHealth();

  return (
    <div className="space-y-6">
          {/* Student Activity Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Student Activity Status</h4>

            <div className="grid grid-cols-3 gap-3">
              {/* Total Students */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-4 border-2 border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 font-medium">Total</div>
                    <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
                  </div>
                </div>
              </motion.div>

              {/* Active Students */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-4 border-2 border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-green-700 font-medium">Active</div>
                    <div className="text-2xl font-bold text-green-900">{activeStudents}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-green-700 font-medium">{activePercentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${activePercentage}%` }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Inactive Students */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`bg-white rounded-xl p-4 border-2 ${inactiveStudents > 0 ? 'border-red-200' : 'border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center text-white ${
                    inactiveStudents > 0 ? 'from-red-500 to-red-600' : 'from-slate-400 to-slate-500'
                  }`}>
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`text-xs font-medium ${inactiveStudents > 0 ? 'text-red-700' : 'text-slate-600'}`}>
                      Inactive
                    </div>
                    <div className={`text-2xl font-bold ${inactiveStudents > 0 ? 'text-red-900' : 'text-slate-900'}`}>
                      {inactiveStudents}
                    </div>
                  </div>
                </div>
                {inactiveStudents > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-red-700 font-medium">{inactivePercentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${inactivePercentage}%` }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
    </div>
  );
};
