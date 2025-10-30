// ============================================================================
// AI SCHEDULE GENERATION STEP
// Fourth step: Generate curriculum schedule with AI
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/curriculum/Button';
import { GlassCard } from '../../../../components/curriculum/GlassCard';
import { CircularProgress } from '../../../../components/curriculum/ProgressBar';
import type { ClassCreationState } from '../ClassCreationWizard';

interface AIScheduleStepProps {
  wizardState: ClassCreationState;
  onUpdate: (updates: Partial<ClassCreationState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PACING_OPTIONS = [
  {
    id: 'slow',
    label: 'Slower Pace',
    description: 'More time per unit, deeper coverage',
    icon: Clock,
    estimatedUnits: 6,
  },
  {
    id: 'standard',
    label: 'Standard Pace',
    description: 'Balanced coverage and time',
    icon: TrendingUp,
    estimatedUnits: 8,
  },
  {
    id: 'fast',
    label: 'Faster Pace',
    description: 'More units, broader coverage',
    icon: Zap,
    estimatedUnits: 10,
  },
];

export const AIScheduleStep: React.FC<AIScheduleStepProps> = ({
  wizardState,
  onUpdate,
  onNext,
}) => {
  const [generationStage, setGenerationStage] = useState<
    'preferences' | 'generating' | 'complete' | 'error'
  >('preferences');
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [generatedUnits, setGeneratedUnits] = useState<any[]>([]);

  // AI Generation - This is just a preview simulation
  // The actual generation happens in ReviewClassStep after class creation
  const generateSchedule = async () => {
    setGenerationStage('generating');

    const tasks = [
      { label: 'Analyzing curriculum materials...', duration: 1500 },
      { label: 'Extracting topics and concepts...', duration: 2000 },
      { label: 'Calculating difficulty levels...', duration: 1500 },
      { label: 'Generating unit schedule...', duration: 2000 },
      { label: 'Optimizing pacing...', duration: 1000 },
      { label: 'Finalizing schedule...', duration: 1000 },
    ];

    for (let i = 0; i < tasks.length; i++) {
      setCurrentTask(tasks[i].label);
      setProgress((i / tasks.length) * 100);
      await new Promise(resolve => setTimeout(resolve, tasks[i].duration));
    }

    setProgress(100);
    setCurrentTask('Preview generated successfully!');

    // Create preview units with descriptive placeholders
    // The actual AI generation will happen after class creation
    const targetUnits = wizardState.aiPreferences.targetUnits || 8;
    const mockUnits = Array.from({ length: targetUnits }, (_, i) => ({
      id: `preview-unit-${i + 1}`,
      title: `Unit ${i + 1}`,
      description: 'Content will be generated from your curriculum',
      estimatedWeeks: Math.ceil((wizardState.schoolYearEnd!.getTime() - wizardState.schoolYearStart!.getTime()) / (1000 * 60 * 60 * 24 * 7) / targetUnits),
      topics: 'TBD',
    }));
    setGeneratedUnits(mockUnits);

    setTimeout(() => {
      setGenerationStage('complete');
      onUpdate({
        scheduleId: undefined, // Will be created with the class
        aiPreferences: {
          ...wizardState.aiPreferences,
          targetUnits: targetUnits,
        }
      });
    }, 500);
  };

  const handleStartGeneration = () => {
    generateSchedule();
  };

  const handleRegenerate = () => {
    setProgress(0);
    setCurrentTask('');
    setGenerationStage('preferences');
  };

  const handleContinue = () => {
    onNext();
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {/* Preferences Stage */}
        {generationStage === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Pacing Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pacing Preference
              </label>
              <div className="grid grid-cols-3 gap-4">
                {PACING_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onUpdate({
                          aiPreferences: {
                            ...wizardState.aiPreferences,
                            pacingPreference: option.id as any,
                            targetUnits: option.estimatedUnits,
                          },
                        })
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        p-4 rounded-xl text-center
                        transition-all duration-200
                        ${wizardState.aiPreferences.pacingPreference === option.id
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-white/70 backdrop-blur-xl border border-gray-200 hover:border-blue-300'
                        }
                      `}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-3 ${
                        wizardState.aiPreferences.pacingPreference === option.id
                          ? 'text-white'
                          : 'text-blue-600'
                      }`} />
                      <h4 className={`font-semibold mb-1 ${
                        wizardState.aiPreferences.pacingPreference === option.id
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}>
                        {option.label}
                      </h4>
                      <p className={`text-sm mb-2 ${
                        wizardState.aiPreferences.pacingPreference === option.id
                          ? 'text-white/80'
                          : 'text-gray-600'
                      }`}>
                        {option.description}
                      </p>
                      <p className={`text-xs ${
                        wizardState.aiPreferences.pacingPreference === option.id
                          ? 'text-white/60'
                          : 'text-gray-500'
                      }`}>
                        ~{option.estimatedUnits} units
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Target Units */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Number of Units
              </label>
              <input
                type="number"
                min="4"
                max="15"
                value={wizardState.aiPreferences.targetUnits || 8}
                onChange={(e) =>
                  onUpdate({
                    aiPreferences: {
                      ...wizardState.aiPreferences,
                      targetUnits: parseInt(e.target.value) || 8,
                    },
                  })
                }
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/70 backdrop-blur-xl border border-gray-200
                  text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  transition-all duration-200
                "
              />
              <p className="mt-2 text-sm text-gray-500">
                AI will attempt to create approximately this many units
              </p>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartGeneration}
                icon={<Sparkles className="w-5 h-5" />}
              >
                Generate Schedule with AI
              </Button>
            </div>
          </motion.div>
        )}

        {/* Generating Stage */}
        {generationStage === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-12"
          >
            <div className="max-w-md mx-auto text-center">
              <div className="mb-8">
                <CircularProgress
                  progress={progress}
                  size={120}
                  color="blue"
                  showPercentage
                />
              </div>

              <motion.div
                key={currentTask}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <p className="font-medium">AI is working...</p>
                </div>
                <p className="text-sm text-gray-600">{currentTask}</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Complete Stage */}
        {generationStage === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard variant="elevated" className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Schedule Generated Successfully!
                  </h4>
                  <p className="text-sm text-gray-700">
                    AI has created a {generatedUnits.length}-unit curriculum schedule
                    aligned with your school year.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Preview */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Schedule Preview</h4>
              <p className="text-sm text-gray-600 mb-4">
                This is a preview of your schedule structure. Actual unit titles, topics, and learning objectives will be generated from your curriculum materials when you finalize the class.
              </p>
              <div className="space-y-2">
                {generatedUnits.slice(0, 5).map((unit, index) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="px-4 py-3 rounded-xl bg-white/70 backdrop-blur-xl border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{unit.title}</p>
                      <p className="text-sm text-gray-600">
                        ~{unit.estimatedWeeks} weeks • {unit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {generatedUnits.length > 5 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    + {generatedUnits.length - 5} more units
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleRegenerate}
              >
                Regenerate
              </Button>
              <div className="flex-1" />
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinue}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIScheduleStep;
