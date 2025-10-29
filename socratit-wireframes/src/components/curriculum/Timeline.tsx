// ============================================================================
// TIMELINE COMPONENT
// Visual timeline for curriculum schedule
// ============================================================================

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { GlassPanel } from './GlassCard';
import type { CurriculumUnit } from '../../types/curriculum.types';
import { UNIT_TYPE_CONFIGS } from '../../config/curriculum.config';

interface TimelineProps {
  units: CurriculumUnit[];
  startDate: Date;
  endDate: Date;
  onUnitClick?: (unit: CurriculumUnit) => void;
  viewMode?: 'monthly' | 'weekly';
}

export const Timeline: React.FC<TimelineProps> = ({
  units,
  startDate,
  endDate,
  onUnitClick,
  viewMode = 'monthly',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate visible date range
  const visibleRange = useMemo(() => {
    if (viewMode === 'monthly') {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    } else {
      // Weekly view (4 weeks)
      const weeks = eachWeekOfInterval({
        start: currentDate,
        end: addMonths(currentDate, 1),
      }).slice(0, 4);
      return {
        start: weeks[0],
        end: weeks[weeks.length - 1],
      };
    }
  }, [currentDate, viewMode]);

  // Get units in visible range
  const visibleUnits = useMemo(() => {
    return units.filter((unit) => {
      const unitStart = new Date(unit.startDate);
      const unitEnd = new Date(unit.endDate);
      return (
        isWithinInterval(unitStart, visibleRange) ||
        isWithinInterval(unitEnd, visibleRange) ||
        (unitStart <= visibleRange.start && unitEnd >= visibleRange.end)
      );
    });
  }, [units, visibleRange]);

  // Generate days for the grid
  const days = useMemo(() => {
    return eachDayOfInterval(visibleRange);
  }, [visibleRange]);

  // Navigate months
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Check if a unit spans a specific day
  const getUnitsForDay = (day: Date) => {
    return visibleUnits.filter((unit) => {
      const unitStart = new Date(unit.startDate);
      const unitEnd = new Date(unit.endDate);
      return isWithinInterval(day, { start: unitStart, end: unitEnd });
    });
  };

  // Calculate position and width for unit bar
  const getUnitBarStyle = (unit: CurriculumUnit) => {
    const unitStart = new Date(unit.startDate);
    const unitEnd = new Date(unit.endDate);

    const visibleStart = unitStart < visibleRange.start ? visibleRange.start : unitStart;
    const visibleEnd = unitEnd > visibleRange.end ? visibleRange.end : unitEnd;

    const startIndex = days.findIndex((day) => isSameDay(day, visibleStart));
    const endIndex = days.findIndex((day) => isSameDay(day, visibleEnd));

    const left = (startIndex / days.length) * 100;
    const width = ((endIndex - startIndex + 1) / days.length) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <GlassPanel
      title="Curriculum Timeline"
      subtitle={`${format(visibleRange.start, 'MMM yyyy')} - ${visibleUnits.length} units`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-white/50 rounded-lg p-1">
            <button
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-white/70 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-white/70 rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      }
    >
      {/* Calendar Header */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative">
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {days.map((day, idx) => {
            const dayUnits = getUnitsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={idx}
                className={`
                  relative h-24 rounded-lg p-2
                  ${isToday ? 'bg-blue-50 ring-2 ring-blue-500' : ''}
                  ${isWeekend ? 'bg-gray-50/50' : 'bg-white/30'}
                  backdrop-blur-sm
                  transition-all duration-200
                `}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${isToday ? 'text-blue-600' : 'text-gray-700'}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Unit indicators */}
                {dayUnits.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dayUnits.slice(0, 2).map((unit) => {
                      const config = UNIT_TYPE_CONFIGS[unit.unitType];
                      return (
                        <div
                          key={unit.id}
                          className={`
                            w-2 h-2 rounded-full
                            bg-${config.color}-500
                          `}
                          title={unit.title}
                        />
                      );
                    })}
                    {dayUnits.length > 2 && (
                      <span className="text-[10px] text-gray-500">
                        +{dayUnits.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unit bars */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Units in this period
          </h4>
          {visibleUnits.map((unit, idx) => {
            const config = UNIT_TYPE_CONFIGS[unit.unitType];
            const style = getUnitBarStyle(unit);

            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative h-16"
              >
                <div
                  className={`
                    absolute top-0 h-full
                    bg-gradient-to-r from-${config.color}-400 to-${config.color}-600
                    rounded-lg p-3
                    cursor-pointer
                    hover:shadow-lg hover:scale-[1.02]
                    transition-all duration-200
                    backdrop-blur-sm
                  `}
                  style={style}
                  onClick={() => onUnitClick?.(unit)}
                >
                  <div className="flex items-center gap-2 h-full">
                    <span className="text-lg">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        Unit {unit.unitNumber}: {unit.title}
                      </p>
                      <p className="text-white/80 text-xs">
                        {format(new Date(unit.startDate), 'MMM d')} -{' '}
                        {format(new Date(unit.endDate), 'MMM d')}
                      </p>
                    </div>
                    <div className="text-white/90 text-xs font-medium">
                      {Math.round(unit.percentComplete)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {visibleUnits.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No units scheduled for this period</p>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
};

export default Timeline;
