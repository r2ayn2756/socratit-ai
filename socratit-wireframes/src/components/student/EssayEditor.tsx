// ============================================================================
// ESSAY EDITOR COMPONENT
// Student interface for writing essays with paste prevention and word count
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../common';
import { Button } from '../common/Button';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { RubricCriterion, EssayConfig } from '../../services/assignment.service';

export interface EssayEditorProps {
  essayContent: string;
  onChange: (content: string) => void;
  onAutoSave?: () => void;
  essayConfig?: EssayConfig;
  rubric?: RubricCriterion[];
  autoSaveStatus?: 'saved' | 'saving' | 'idle';
  aiAssistantEnabled?: boolean;
  onAIAssist?: () => void;
}

export const EssayEditor: React.FC<EssayEditorProps> = ({
  essayContent,
  onChange,
  onAutoSave,
  essayConfig,
  rubric,
  autoSaveStatus = 'idle',
  aiAssistantEnabled = false,
  onAIAssist,
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate word and character count
  useEffect(() => {
    const text = essayContent.trim();
    const words = text.length > 0 ? text.split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  }, [essayContent]);

  // Auto-save functionality
  useEffect(() => {
    if (essayContent && onAutoSave) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for 3 seconds after typing stops
      autoSaveTimerRef.current = setTimeout(() => {
        onAutoSave();
      }, 3000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [essayContent, onAutoSave]);

  // Paste prevention handler
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setPasteWarning(true);

    // Hide warning after 5 seconds
    setTimeout(() => {
      setPasteWarning(false);
    }, 5000);
  }, []);

  // Handle keyboard shortcuts that might be used for pasting
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent Ctrl+V / Cmd+V
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      setPasteWarning(true);
      setTimeout(() => {
        setPasteWarning(false);
      }, 5000);
    }
  }, []);

  // Calculate progress against word count requirements
  const getWordCountStatus = () => {
    if (!essayConfig?.minWords && !essayConfig?.maxWords) return null;

    if (essayConfig.minWords && wordCount < essayConfig.minWords) {
      return {
        type: 'warning' as const,
        message: `${essayConfig.minWords - wordCount} words needed`,
        progress: (wordCount / essayConfig.minWords) * 100,
      };
    }

    if (essayConfig.maxWords && wordCount > essayConfig.maxWords) {
      return {
        type: 'error' as const,
        message: `${wordCount - essayConfig.maxWords} words over limit`,
        progress: 100,
      };
    }

    return {
      type: 'success' as const,
      message: 'Word count requirement met',
      progress: 100,
    };
  };

  const wordCountStatus = getWordCountStatus();

  return (
    <div className="space-y-4">
      {/* Paste Warning */}
      <AnimatePresence>
        {pasteWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Pasting is Disabled</h3>
                <p className="text-sm text-amber-800 mt-1">
                  To ensure academic integrity, pasting content is not allowed. Please type your essay directly into the editor.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Header */}
      <Card variant="glassElevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Essay</h3>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-slate-600">
                  {wordCount} words • {charCount} characters
                </span>
                {essayConfig && (essayConfig.minWords || essayConfig.maxWords) && (
                  <span className="text-xs text-slate-500">
                    {essayConfig.minWords && `Min: ${essayConfig.minWords} words`}
                    {essayConfig.minWords && essayConfig.maxWords && ' • '}
                    {essayConfig.maxWords && `Max: ${essayConfig.maxWords} words`}
                  </span>
                )}
              </div>
            </div>

            {/* Auto-save indicator */}
            <AnimatePresence>
              {autoSaveStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  {autoSaveStatus === 'saving' && (
                    <>
                      <Save className="w-4 h-4 text-slate-400 animate-pulse" />
                      <span className="text-sm text-slate-600">Saving...</span>
                    </>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Saved</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            {aiAssistantEnabled && onAIAssist && (
              <Button type="button" variant="ghost" size="sm" onClick={onAIAssist}>
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                AI Assistant
              </Button>
            )}
            {rubric && rubric.length > 0 && essayConfig?.showRubricToStudent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowRubric(!showRubric)}
              >
                {showRubric ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showRubric ? 'Hide' : 'Show'} Rubric
              </Button>
            )}
          </div>
        </div>

        {/* Word Count Progress Bar */}
        {wordCountStatus && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${
                wordCountStatus.type === 'error' ? 'text-red-600' :
                wordCountStatus.type === 'warning' ? 'text-amber-600' :
                'text-green-600'
              }`}>
                {wordCountStatus.message}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  wordCountStatus.type === 'error' ? 'bg-red-500' :
                  wordCountStatus.type === 'warning' ? 'bg-amber-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(wordCountStatus.progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Essay Textarea */}
        <textarea
          ref={textareaRef}
          value={essayContent}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Start writing your essay here... (pasting is disabled)"
          className="w-full min-h-[500px] px-4 py-3 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-y font-serif text-base leading-relaxed"
          style={{ lineHeight: '1.8' }}
        />

        <div className="mt-2 text-xs text-slate-500">
          Tip: Focus on clear arguments, strong evidence, and proper organization. Use the AI assistant if you need help developing ideas.
        </div>
      </Card>

      {/* Rubric Display */}
      <AnimatePresence>
        {showRubric && rubric && rubric.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card variant="glassElevated">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Grading Rubric</h3>
              <div className="space-y-4">
                {rubric.map((criterion) => (
                  <div key={criterion.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{criterion.name}</h4>
                      <span className="text-sm font-medium text-blue-600">{criterion.maxPoints} points</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">{criterion.description}</p>

                    {criterion.proficiencyLevels && criterion.proficiencyLevels.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-slate-600 uppercase">Proficiency Levels</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {criterion.proficiencyLevels.map((level) => (
                            <div key={level.id} className="p-2 bg-white rounded border border-slate-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-700">{level.name}</span>
                                <span className="text-xs text-blue-600">{level.points} pts</span>
                              </div>
                              <p className="text-xs text-slate-600">{level.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600">
                <strong>Total Points:</strong> {rubric.reduce((sum, c) => sum + c.maxPoints, 0)}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
