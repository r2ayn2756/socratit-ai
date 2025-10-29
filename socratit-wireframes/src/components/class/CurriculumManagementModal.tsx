// ============================================================================
// CURRICULUM MANAGEMENT MODAL
// Full-screen modal for managing curriculum schedule
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid, Calendar, MessageSquare } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { SortableUnitGrid } from '../curriculum/SortableUnitGrid';
import { Timeline } from '../curriculum/Timeline';
import { AIChatAssistant } from '../curriculum/AIChatAssistant';
import type { CurriculumSchedule, CurriculumUnit } from '../../types/curriculum.types';
import { curriculumApi } from '../../services/curriculumApi.service';

interface CurriculumManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
}

type ViewMode = 'units' | 'timeline' | 'ai-assistant';

export const CurriculumManagementModal: React.FC<CurriculumManagementModalProps> = ({
  isOpen,
  onClose,
  scheduleId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('units');
  const [schedule, setSchedule] = useState<CurriculumSchedule | null>(null);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSchedule();
    }
  }, [isOpen, scheduleId]);

  const loadSchedule = async () => {
    setIsLoading(true);
    try {
      // Load schedule and units in parallel
      const [scheduleData, unitsData] = await Promise.all([
        curriculumApi.schedules.getSchedule(scheduleId),
        curriculumApi.units.getScheduleUnits(scheduleId),
      ]);

      setSchedule(scheduleData as CurriculumSchedule);
      setUnits(unitsData);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnitsReorder = async (reorderedUnits: CurriculumUnit[]) => {
    // Optimistically update UI
    setUnits(reorderedUnits);

    try {
      // Persist reorder to backend
      await curriculumApi.units.reorderUnits({
        scheduleId,
        unitOrders: reorderedUnits.map((unit, index) => ({
          unitId: unit.id,
          orderIndex: index,
        })),
      });
    } catch (error) {
      console.error('Failed to reorder units:', error);
      // Reload schedule to revert to server state
      loadSchedule();
    }
  };

  const handleScheduleUpdated = () => {
    loadSchedule();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      closeOnEscape={true}
      closeOnOverlayClick={false}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Curriculum Management
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage your year-long curriculum schedule
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 py-4 border-b border-gray-200">
          <button
            onClick={() => setViewMode('units')}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all duration-200
              flex items-center gap-2
              ${viewMode === 'units'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <Grid className="w-4 h-4" />
            <span>Unit Cards</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all duration-200
              flex items-center gap-2
              ${viewMode === 'timeline'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <Calendar className="w-4 h-4" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setViewMode('ai-assistant')}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all duration-200
              flex items-center gap-2
              ${viewMode === 'ai-assistant'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading schedule...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {viewMode === 'units' && (
                  <SortableUnitGrid
                    scheduleId={scheduleId}
                    units={units}
                    onUnitsReorder={handleUnitsReorder}
                    onUnitClick={(unit) => console.log('Unit clicked:', unit)}
                    onAddUnit={() => console.log('Add unit')}
                    editable={true}
                  />
                )}

                {viewMode === 'timeline' && schedule && (
                  <Timeline
                    units={units}
                    startDate={new Date(schedule.schoolYearStart)}
                    endDate={new Date(schedule.schoolYearEnd)}
                    onUnitClick={(unit) => console.log('Unit clicked:', unit)}
                    viewMode="monthly"
                  />
                )}

                {viewMode === 'ai-assistant' && (
                  <AIChatAssistant
                    scheduleId={scheduleId}
                    onScheduleUpdated={handleScheduleUpdated}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CurriculumManagementModal;
