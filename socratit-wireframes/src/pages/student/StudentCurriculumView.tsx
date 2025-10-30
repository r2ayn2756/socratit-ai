// ============================================================================
// STUDENT CURRICULUM VIEW
// Student-facing curriculum schedule display with progress tracking
// ============================================================================

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UnitDetailsModal } from '../../components/curriculum/UnitDetailsModal';
import { curriculumApi } from '../../services/curriculumApi.service';
import type { CurriculumUnit, CurriculumSchedule } from '../../types/curriculum.types';
import { format } from 'date-fns';

export const StudentCurriculumView: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [selectedUnit, setSelectedUnit] = useState<CurriculumUnit | null>(null);
  const [showUnitDetails, setShowUnitDetails] = useState(false);

  // Fetch curriculum schedule
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['class-schedules', classId],
    queryFn: () => curriculumApi.schedules.getClassSchedules(classId!),
    enabled: !!classId,
  });

  // Get the first published schedule
  const schedule: CurriculumSchedule | null = schedules?.find(
    (s: CurriculumSchedule) => s.status === 'PUBLISHED'
  ) || null;

  const handleUnitClick = (unit: CurriculumUnit) => {
    // Only allow clicking on units that have started or are in progress
    const unitStartDate = new Date(unit.startDate);
    const now = new Date();

    if (unitStartDate <= now || unit.status === 'IN_PROGRESS' || unit.status === 'COMPLETED') {
      setSelectedUnit(unit);
      setShowUnitDetails(true);
    }
  };

  const getUnitStatusColor = (unit: CurriculumUnit) => {
    const now = new Date();
    const startDate = new Date(unit.startDate);
    const endDate = new Date(unit.endDate);

    if (unit.status === 'COMPLETED') {
      return 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50';
    }
    if (unit.status === 'IN_PROGRESS' || (now >= startDate && now <= endDate)) {
      return 'border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50';
    }
    if (now < startDate) {
      return 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100';
    }
    return 'border-gray-300 bg-white';
  };

  const isUnitLocked = (unit: CurriculumUnit) => {
    const now = new Date();
    const startDate = new Date(unit.startDate);
    return now < startDate && unit.status === 'SCHEDULED';
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading curriculum...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !schedule) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Curriculum Available
            </h2>
            <p className="text-gray-600">
              Your teacher hasn't published a curriculum schedule for this class yet.
              Check back later!
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const units = (schedule.units || []) as CurriculumUnit[];
  const currentUnit = units.find(
    (u) => u.status === 'IN_PROGRESS' ||
    (new Date(u.startDate) <= new Date() && new Date() <= new Date(u.endDate))
  );

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {schedule.title}
                </h1>
                {schedule.description && (
                  <p className="text-gray-600 mb-4">{schedule.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {format(new Date(schedule.schoolYearStart), 'MMM d, yyyy')} -{' '}
                      {format(new Date(schedule.schoolYearEnd), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {schedule.totalUnits} units
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {schedule.totalWeeks} weeks
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Your Progress
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  {schedule.percentComplete}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${schedule.percentComplete}%` }}
                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {schedule.completedUnits} of {schedule.totalUnits} units completed
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current Unit Spotlight */}
        {currentUnit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold">
                  CURRENT UNIT
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Unit {currentUnit.unitNumber}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentUnit.title}
              </h2>
              {currentUnit.description && (
                <p className="text-gray-700 mb-4">{currentUnit.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">
                      {format(new Date(currentUnit.startDate), 'MMM d')} -{' '}
                      {format(new Date(currentUnit.endDate), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">
                      {currentUnit.estimatedWeeks} weeks
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnitClick(currentUnit)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* All Units Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Units</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((unit, index) => {
              const locked = isUnitLocked(unit);
              return (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={locked ? {} : { scale: 1.02 }}
                  onClick={() => handleUnitClick(unit)}
                  className={`
                    p-5 rounded-xl border-2 shadow-md transition-all
                    ${getUnitStatusColor(unit)}
                    ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-600">
                        Unit {unit.unitNumber}
                      </span>
                      {unit.status === 'COMPLETED' && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      {locked && <Lock className="w-4 h-4 text-gray-400" />}
                    </div>
                    {unit.difficultyLevel && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          Level {unit.difficultyLevel}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {unit.title}
                  </h3>

                  {unit.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {unit.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(unit.startDate), 'MMM d')}
                      </span>
                    </div>
                    <span>{unit.estimatedWeeks}w</span>
                  </div>

                  {unit.percentComplete !== undefined && unit.percentComplete > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${unit.percentComplete}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {unit.percentComplete}% complete
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Unit Details Modal */}
      <UnitDetailsModal
        unit={selectedUnit}
        isOpen={showUnitDetails}
        onClose={() => {
          setShowUnitDetails(false);
          setSelectedUnit(null);
        }}
        userRole="student"
      />
    </DashboardLayout>
  );
};

export default StudentCurriculumView;
