// ============================================================================
// DATE PICKER COMPONENT
// Apple-style date picker with glass morphism
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  helperText?: string;
  className?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  error,
  helperText,
  className = '',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();

  // Create empty cells for days before month starts
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const handleDateSelect = (date: Date) => {
    // Check if date is within valid range
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    onChange(date);
    setIsOpen(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-white/70 backdrop-blur-xl border
            ${error ? 'border-red-300' : 'border-gray-200'}
            text-left text-gray-900
            hover:bg-white/90 hover:border-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            transition-all duration-200
            flex items-center justify-between
          `}
          aria-label={label || 'Select date'}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-required={required}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value ? format(value, 'MMMM d, yyyy') : placeholder}
          </span>
          <Calendar className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </button>

        {/* Calendar Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Calendar Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 z-20 w-80 bg-white/95 backdrop-blur-2xl border border-gray-200/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Month Navigation */}
              <div className="px-4 py-3 border-b border-gray-200/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <h3 className="text-base font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before month starts */}
                  {emptyDays.map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}

                  {/* Days of the month */}
                  {daysInMonth.map((date) => {
                    const isSelected = value && isSameDay(date, value);
                    const isCurrentDay = isToday(date);
                    const disabled = isDateDisabled(date);

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => !disabled && handleDateSelect(date)}
                        disabled={disabled}
                        className={`
                          aspect-square rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${disabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-blue-50'
                          }
                          ${isSelected
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                            : 'text-gray-700'
                          }
                          ${isCurrentDay && !isSelected
                            ? 'ring-2 ring-blue-400'
                            : ''
                          }
                        `}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Select Options */}
              <div className="px-4 py-3 border-t border-gray-200/50 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDateSelect(new Date())}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Today
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null as any);
                      setIsOpen(false);
                    }}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <p className={`mt-2 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// DATE RANGE PICKER COMPONENT
// ============================================================================

interface DateRangePickerProps {
  label?: string;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  error?: string;
  helperText?: string;
  className?: string;
  required?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startPlaceholder = 'Start date',
  endPlaceholder = 'End date',
  error,
  helperText,
  className = '',
  required = false,
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="grid grid-cols-2 gap-4">
        <DatePicker
          placeholder={startPlaceholder}
          value={startDate}
          onChange={onStartDateChange}
          maxDate={endDate || undefined}
        />
        <DatePicker
          placeholder={endPlaceholder}
          value={endDate}
          onChange={onEndDateChange}
          minDate={startDate || undefined}
        />
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <p className={`mt-2 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default DatePicker;
