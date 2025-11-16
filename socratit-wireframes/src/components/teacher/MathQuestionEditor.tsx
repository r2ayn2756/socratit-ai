// ============================================================================
// MATH QUESTION EDITOR COMPONENT
// LaTeX-enabled question editor for Interactive Math assignments
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Eye, EyeOff, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Button } from '../common';

export interface MathQuestion {
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
  imageUrl?: string;
}

interface MathQuestionEditorProps {
  question: MathQuestion;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  isReadOnly?: boolean;
}

export const MathQuestionEditor: React.FC<MathQuestionEditorProps> = ({
  question,
  index,
  onUpdate,
  onRemove,
  isReadOnly = false,
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [currentHint, setCurrentHint] = useState('');

  const addHint = () => {
    if (currentHint.trim()) {
      const hints = question.hints || [];
      onUpdate(index, 'hints', [...hints, currentHint.trim()]);
      setCurrentHint('');
    }
  };

  const removeHint = (hintIndex: number) => {
    const hints = question.hints || [];
    onUpdate(index, 'hints', hints.filter((_, i) => i !== hintIndex));
  };

  const renderLatexPreview = (latex: string) => {
    try {
      return <BlockMath math={latex} />;
    } catch (error) {
      return <div className="text-red-500 text-sm">Invalid LaTeX syntax</div>;
    }
  };

  const insertLatexSymbol = (symbol: string) => {
    const textarea = document.getElementById(`latex-${index}`) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = question.latexExpression || '';
      const newText = text.substring(0, start) + symbol + text.substring(end);
      onUpdate(index, 'latexExpression', newText);

      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + symbol.length, start + symbol.length);
      }, 0);
    }
  };

  const commonSymbols = [
    { label: 'x²', latex: 'x^2' },
    { label: '√', latex: '\\sqrt{}' },
    { label: '∫', latex: '\\int' },
    { label: '∑', latex: '\\sum' },
    { label: '∞', latex: '\\infty' },
    { label: 'π', latex: '\\pi' },
    { label: 'α', latex: '\\alpha' },
    { label: 'β', latex: '\\beta' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' },
    { label: '≠', latex: '\\neq' },
    { label: '÷', latex: '\\div' },
    { label: '×', latex: '\\times' },
    { label: 'Fraction', latex: '\\frac{}{}' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200 rounded-xl shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">Math Question {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            {showPreview ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
          </button>
          {!isReadOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Question Type */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Question Type</label>
          <select
            value={question.type}
            onChange={(e) => onUpdate(index, 'type', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="MATH_EXPRESSION">Math Expression</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="FREE_RESPONSE">Free Response</option>
          </select>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Question Text</label>
          <textarea
            value={question.questionText}
            onChange={(e) => onUpdate(index, 'questionText', e.target.value)}
            placeholder="Enter question text... (You can use inline LaTeX with $...$ or $$...$$)"
            rows={2}
            disabled={isReadOnly}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          {showPreview && question.questionText && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-indigo-100">
              <p className="text-sm text-slate-700">{question.questionText}</p>
            </div>
          )}
        </div>

        {/* LaTeX Expression Input */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            LaTeX Expression (Optional - for displaying equations)
          </label>

          {/* LaTeX Symbol Palette */}
          <div className="mb-2 p-2 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Quick Insert:</p>
            <div className="flex flex-wrap gap-1">
              {commonSymbols.map((symbol) => (
                <button
                  key={symbol.latex}
                  type="button"
                  onClick={() => insertLatexSymbol(symbol.latex)}
                  disabled={isReadOnly}
                  className="px-2 py-1 text-sm bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={symbol.latex}
                >
                  {symbol.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id={`latex-${index}`}
            value={question.latexExpression || ''}
            onChange={(e) => onUpdate(index, 'latexExpression', e.target.value)}
            placeholder="e.g., f(x) = x^2 + 2x + 1"
            rows={3}
            disabled={isReadOnly}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />

          {/* LaTeX Preview */}
          {showPreview && question.latexExpression && (
            <div className="mt-2 p-4 bg-white rounded-lg border border-indigo-200">
              <p className="text-xs text-slate-500 mb-2">Preview:</p>
              {renderLatexPreview(question.latexExpression)}
            </div>
          )}
        </div>

        {/* Points */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Points</label>
          <input
            type="number"
            min="1"
            value={question.points}
            onChange={(e) => onUpdate(index, 'points', parseInt(e.target.value))}
            disabled={isReadOnly}
            className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Correct Answer for MATH_EXPRESSION */}
        {question.type === 'MATH_EXPRESSION' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Correct Answer (LaTeX format)
            </label>
            <input
              type="text"
              value={question.correctAnswer || ''}
              onChange={(e) => onUpdate(index, 'correctAnswer', e.target.value)}
              placeholder="e.g., x = 2"
              disabled={isReadOnly}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            {showPreview && question.correctAnswer && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 mb-1">Answer Preview:</p>
                <InlineMath math={question.correctAnswer} />
              </div>
            )}
          </div>
        )}

        {/* Multiple Choice Options */}
        {question.type === 'MULTIPLE_CHOICE' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Answer Options</label>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map((option) => (
                <div key={option} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={question.correctOption === option}
                    onChange={() => onUpdate(index, 'correctOption', option)}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-green-600 border-slate-300 focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-semibold text-slate-600 w-6">{option}.</span>
                    <input
                      type="text"
                      value={(question as any)[`option${option}`] || ''}
                      onChange={(e) => onUpdate(index, `option${option}`, e.target.value)}
                      placeholder={`Option ${option} (can include LaTeX with $...$)`}
                      disabled={isReadOnly}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Select the correct answer</p>
          </div>
        )}

        {/* Step-by-Step Hints */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            <HelpCircle className="w-3 h-3 inline mr-1" />
            Step-by-Step Hints (Progressive)
          </label>

          {/* Existing Hints */}
          {question.hints && question.hints.length > 0 && (
            <div className="mb-2 space-y-2">
              {question.hints.map((hint, hintIndex) => (
                <div key={hintIndex} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-indigo-600 mt-1">Hint {hintIndex + 1}:</span>
                  <p className="flex-1 text-sm text-slate-700">{hint}</p>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeHint(hintIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Hint */}
          {!isReadOnly && (
            <div className="flex gap-2">
              <input
                type="text"
                value={currentHint}
                onChange={(e) => setCurrentHint(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHint())}
                placeholder="Add a progressive hint..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={addHint}
                disabled={!currentHint.trim()}
              >
                Add Hint
              </Button>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Hints are revealed progressively to guide students without giving the answer
          </p>
        </div>
      </div>
    </motion.div>
  );
};
