// ============================================================================
// CLASS SELECTION STEP
// First step: Select class for curriculum schedule
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, BookOpen } from 'lucide-react';
import { GlassCard } from '../../GlassCard';
import type { ScheduleWizardState } from '../../../../types/curriculum.types';

interface ClassSelectionStepProps {
  wizardState: ScheduleWizardState;
  onUpdate: (updates: Partial<ScheduleWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock data - replace with actual API call
const mockClasses = [
  {
    id: '1',
    name: '8th Grade Math - Period 2',
    subject: 'Mathematics',
    students: 28,
    description: 'Algebra I and Pre-Calculus',
  },
  {
    id: '2',
    name: '7th Grade Science - Period 4',
    subject: 'Science',
    students: 24,
    description: 'Life Sciences and Biology',
  },
  {
    id: '3',
    name: '9th Grade English - Period 1',
    subject: 'English',
    students: 30,
    description: 'Literature and Composition',
  },
];

export const ClassSelectionStep: React.FC<ClassSelectionStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(wizardState.classId || '');
  const [classes, setClasses] = useState(mockClasses);

  // Filter classes based on search
  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClass = (classId: string) => {
    setSelectedClass(classId);
    const selected = classes.find((c) => c.id === classId);
    if (selected) {
      onUpdate({
        classId,
        title: `${selected.name} - Curriculum Schedule`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            w-full pl-12 pr-4 py-3
            bg-white/70 backdrop-blur-xl
            border border-white/20
            rounded-xl
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            transition-all duration-200
          "
        />
      </div>

      {/* Class List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredClasses.map((cls, index) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              padding="md"
              hover
              glow={selectedClass === cls.id}
              glowColor="blue"
              onClick={() => handleSelectClass(cls.id)}
              className={`
                cursor-pointer transition-all duration-200
                ${selectedClass === cls.id ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  {/* Class Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl
                    flex items-center justify-center
                    ${
                      selectedClass === cls.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }
                    transition-colors duration-200
                  `}>
                    <BookOpen className="w-6 h-6" />
                  </div>

                  {/* Class Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {cls.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {cls.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{cls.students} students</span>
                      </div>
                      <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                        {cls.subject}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedClass === cls.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No classes found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
        </div>
      )}

      {/* Selected Class Summary */}
      {selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard variant="elevated" padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Selected class:</p>
                <p className="font-semibold text-gray-900">
                  {classes.find((c) => c.id === selectedClass)?.name}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};
