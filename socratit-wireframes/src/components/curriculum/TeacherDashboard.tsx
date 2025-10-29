// ============================================================================
// TEACHER DASHBOARD COMPONENT
// Comprehensive teacher view for managing curriculum schedules
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { GlassPanel } from './GlassCard';
import { Button, IconButton, ButtonGroup } from './Button';
import { SortableUnitGrid } from './SortableUnitGrid';
import { Timeline } from './Timeline';
import { AIChatAssistant } from './AIChatAssistant';
import type { ScheduleResponse, CurriculumUnit } from '../../types/curriculum.types';

interface TeacherDashboardProps {
  schedule: ScheduleResponse;
  onEditSchedule?: () => void;
  onPublishSchedule?: () => void;
  onDeleteSchedule?: () => void;
  onUnitClick?: (unit: CurriculumUnit) => void;
  onAddUnit?: () => void;
}

type ViewMode = 'cards' | 'timeline' | 'ai-assistant';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  schedule,
  onEditSchedule,
  onPublishSchedule,
  onDeleteSchedule,
  onUnitClick,
  onAddUnit,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [units, setUnits] = useState<CurriculumUnit[]>(
    schedule.units.map((u) => ({ ...u } as CurriculumUnit))
  );

  const isPublished = schedule.status === 'PUBLISHED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900">
                {schedule.class.name}
              </h1>
              <span
                className={`
                  px-3 py-1 rounded-lg text-sm font-semibold
                  ${
                    isPublished
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }
                `}
              >
                {schedule.status}
              </span>
            </div>
            <p className="text-gray-600">
              {schedule.totalUnits} units · {schedule.completedUnits} completed ·{' '}
              {Math.round(schedule.percentComplete)}% progress
            </p>
          </div>

          <ButtonGroup>
            {!isPublished && (
              <Button
                variant="primary"
                size="lg"
                icon={<Send className="w-5 h-5" />}
                onClick={onPublishSchedule}
              >
                Publish
              </Button>
            )}
            <IconButton
              icon={<Edit className="w-5 h-5" />}
              variant="secondary"
              onClick={onEditSchedule}
              tooltip="Edit schedule"
            />
            <IconButton
              icon={<Trash2 className="w-5 h-5" />}
              variant="danger"
              onClick={onDeleteSchedule}
              tooltip="Delete schedule"
            />
          </ButtonGroup>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Units */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassPanel>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {schedule.totalUnits}
                  </p>
                  <p className="text-sm text-gray-600">Total Units</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassPanel>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {schedule.completedUnits}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Current Unit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassPanel>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {schedule.currentUnit?.title || 'None'}
                  </p>
                  <p className="text-sm text-gray-600">Current Unit</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassPanel>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(schedule.percentComplete)}%
                  </p>
                  <p className="text-sm text-gray-600">Average Progress</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center justify-center">
          <div className="inline-flex bg-white/70 backdrop-blur-xl border border-white/20 rounded-xl p-1 shadow-md">
            <button
              onClick={() => setViewMode('cards')}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${
                  viewMode === 'cards'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Unit Cards
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${
                  viewMode === 'timeline'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('ai-assistant')}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                ${
                  viewMode === 'ai-assistant'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[600px]">
          {viewMode === 'cards' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SortableUnitGrid
                scheduleId={schedule.id}
                units={units}
                onUnitsReorder={setUnits}
                onUnitClick={onUnitClick}
                onAddUnit={onAddUnit}
                editable
              />
            </motion.div>
          )}

          {viewMode === 'timeline' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Timeline
                units={units}
                startDate={new Date(schedule.schoolYearStart)}
                endDate={new Date(schedule.schoolYearEnd)}
                onUnitClick={onUnitClick}
                viewMode="monthly"
              />
            </motion.div>
          )}

          {viewMode === 'ai-assistant' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AIChatAssistant
                scheduleId={schedule.id}
                onScheduleUpdated={() => {
                  // Refresh schedule data
                  window.location.reload();
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        {!isPublished && (
          <div className="fixed bottom-8 right-8">
            <ButtonGroup orientation="vertical">
              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={onAddUnit}
                className="shadow-xl"
              >
                Add Unit
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<Send className="w-5 h-5" />}
                onClick={onPublishSchedule}
                className="shadow-xl"
              >
                Publish Schedule
              </Button>
            </ButtonGroup>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
