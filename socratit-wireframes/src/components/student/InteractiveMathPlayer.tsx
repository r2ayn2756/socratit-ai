// ============================================================================
// INTERACTIVE MATH PLAYER COMPONENT
// Math assignment player with Desmos calculator, hints, and LaTeX support
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import {
  Calculator as CalcIcon,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  XCircle,
  Lightbulb,
  BarChart3,
} from 'lucide-react';
import { Button, Card } from '../common';
import { MathInput } from './MathInput';
import { BasicCalculator } from './BasicCalculator';

// Declare Desmos type for TypeScript
declare global {
  interface Window {
    Desmos: any;
  }
}

interface MathQuestion {
  id: string;
  type: 'MATH_EXPRESSION' | 'MULTIPLE_CHOICE' | 'FREE_RESPONSE';
  questionText: string;
  questionOrder: number;
  points: number;
  latexExpression?: string;
  correctAnswer?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: 'A' | 'B' | 'C' | 'D';
  hints?: string[];
}

interface MathSettings {
  enableGraphingCalculator: boolean;
  enableBasicCalculator: boolean;
  enableStepByStepHints: boolean;
}

interface InteractiveMathPlayerProps {
  questions: MathQuestion[];
  settings: MathSettings;
  onSubmitAnswer: (questionId: string, answer: string | { selectedOption: string }) => void;
  onComplete: () => void;
  showCorrectAnswers?: boolean;
}

export const InteractiveMathPlayer: React.FC<InteractiveMathPlayerProps> = ({
  questions,
  settings,
  onSubmitAnswer,
  onComplete,
  showCorrectAnswers = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [hintsRevealed, setHintsRevealed] = useState<Record<string, number>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [showGraphingCalc, setShowGraphingCalc] = useState(false);
  const [desmosLoaded, setDesmosLoaded] = useState(false);

  const desmosRef = useRef<HTMLDivElement>(null);
  const calculatorInstance = useRef<any>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Load Desmos API
  useEffect(() => {
    if (settings.enableGraphingCalculator && !window.Desmos) {
      const script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.7/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.async = true;
      script.onload = () => setDesmosLoaded(true);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } else if (window.Desmos) {
      setDesmosLoaded(true);
    }
  }, [settings.enableGraphingCalculator]);

  // Initialize Desmos calculator
  useEffect(() => {
    if (showGraphingCalc && desmosLoaded && desmosRef.current && !calculatorInstance.current) {
      calculatorInstance.current = window.Desmos.GraphingCalculator(desmosRef.current, {
        expressionsCollapsed: true,
        settingsMenu: false,
        zoomButtons: true,
        expressionsTopbar: true,
      });

      // Add initial expression if question has LaTeX
      if (currentQuestion.latexExpression) {
        calculatorInstance.current.setExpression({
          id: 'question-expr',
          latex: currentQuestion.latexExpression,
        });
      }
    }

    return () => {
      if (calculatorInstance.current) {
        calculatorInstance.current.destroy();
        calculatorInstance.current = null;
      }
    };
  }, [showGraphingCalc, desmosLoaded, currentQuestion]);

  const revealNextHint = () => {
    const questionId = currentQuestion.id;
    const currentHintCount = hintsRevealed[questionId] || 0;
    const totalHints = currentQuestion.hints?.length || 0;

    if (currentHintCount < totalHints) {
      setHintsRevealed({
        ...hintsRevealed,
        [questionId]: currentHintCount + 1,
      });
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOptions({
      ...selectedOptions,
      [currentQuestion.id]: option,
    });
  };

  const handleNext = () => {
    // Submit current answer
    if (currentQuestion.type === 'MULTIPLE_CHOICE') {
      const selected = selectedOptions[currentQuestion.id];
      if (selected) {
        onSubmitAnswer(currentQuestion.id, { selectedOption: selected });
      }
    } else {
      const answer = answers[currentQuestion.id];
      if (answer) {
        onSubmitAnswer(currentQuestion.id, answer);
      }
    }

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const renderLatex = (latex: string) => {
    try {
      return <BlockMath math={latex} />;
    } catch (error) {
      return <div className="text-red-500 text-sm">Invalid LaTeX</div>;
    }
  };

  const canProceed = () => {
    if (currentQuestion.type === 'MULTIPLE_CHOICE') {
      return !!selectedOptions[currentQuestion.id];
    }
    return !!(answers[currentQuestion.id] && answers[currentQuestion.id].trim());
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-slate-600">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Card */}
          <Card variant="glassElevated">
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600">
                        {currentQuestionIndex + 1}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600">
                      {currentQuestion.points} points
                    </span>
                  </div>
                  <p className="text-lg text-slate-900">{currentQuestion.questionText}</p>
                </div>
              </div>

              {/* LaTeX Expression Display */}
              {currentQuestion.latexExpression && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  {renderLatex(currentQuestion.latexExpression)}
                </div>
              )}

              {/* Answer Input Area */}
              <div className="space-y-4">
                {currentQuestion.type === 'MATH_EXPRESSION' && (
                  <MathInput
                    value={answers[currentQuestion.id] || ''}
                    onChange={handleAnswerChange}
                    placeholder="Enter your answer using LaTeX notation..."
                  />
                )}

                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const optionText = (currentQuestion as any)[`option${option}`];
                      if (!optionText) return null;

                      const isSelected = selectedOptions[currentQuestion.id] === option;
                      const isCorrect = showCorrectAnswers && currentQuestion.correctOption === option;

                      return (
                        <motion.button
                          key={option}
                          type="button"
                          onClick={() => handleOptionSelect(option)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          } ${
                            showCorrectAnswers && isCorrect
                              ? 'border-green-500 bg-green-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-3 h-3 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold text-slate-600 mr-2">{option}.</span>
                              <span className="text-slate-900">{optionText}</span>
                            </div>
                            {showCorrectAnswers && isCorrect && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'FREE_RESPONSE' && (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Enter your detailed answer here..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  variant="glass"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Tools and Hints */}
        <div className="space-y-4">
          {/* Tools */}
          <Card variant="glassElevated">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalcIcon className="w-5 h-5 text-indigo-600" />
              Math Tools
            </h3>

            <div className="space-y-2">
              {settings.enableGraphingCalculator && (
                <Button
                  variant={showGraphingCalc ? 'gradient' : 'glass'}
                  className="w-full justify-start"
                  onClick={() => {
                    setShowGraphingCalc(!showGraphingCalc);
                    setShowCalculator(false);
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Graphing Calculator
                </Button>
              )}

              {settings.enableBasicCalculator && (
                <Button
                  variant={showCalculator ? 'gradient' : 'glass'}
                  className="w-full justify-start"
                  onClick={() => {
                    setShowCalculator(!showCalculator);
                    setShowGraphingCalc(false);
                  }}
                >
                  <CalcIcon className="w-4 h-4 mr-2" />
                  Basic Calculator
                </Button>
              )}
            </div>
          </Card>

          {/* Hints */}
          {settings.enableStepByStepHints && currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <Card variant="glassElevated">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Hints
              </h3>

              <div className="space-y-3">
                {currentQuestion.hints.map((hint, index) => {
                  const isRevealed = (hintsRevealed[currentQuestion.id] || 0) > index;
                  return (
                    <AnimatePresence key={index}>
                      {isRevealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-yellow-700 mb-1">
                                Hint {index + 1}:
                              </p>
                              <p className="text-sm text-slate-700">{hint}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  );
                })}

                {(hintsRevealed[currentQuestion.id] || 0) < currentQuestion.hints.length && (
                  <Button
                    variant="glass"
                    className="w-full"
                    onClick={revealNextHint}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Reveal Next Hint ({(hintsRevealed[currentQuestion.id] || 0) + 1} of{' '}
                    {currentQuestion.hints.length})
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Calculator */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <BasicCalculator onClose={() => setShowCalculator(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desmos Graphing Calculator Modal */}
      <AnimatePresence>
        {showGraphingCalc && desmosLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowGraphingCalc(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl overflow-hidden"
              style={{ width: '900px', height: '600px' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Desmos Graphing Calculator</h3>
                <button
                  onClick={() => setShowGraphingCalc(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div ref={desmosRef} style={{ width: '100%', height: 'calc(100% - 64px)' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
