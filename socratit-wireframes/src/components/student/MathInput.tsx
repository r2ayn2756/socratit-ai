// ============================================================================
// MATH INPUT COMPONENT
// LaTeX-enabled input field for student math responses
// ============================================================================

import React, { useState } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Eye, EyeOff } from 'lucide-react';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter your answer...',
  disabled = false,
  className = '',
  showPreview = true,
}) => {
  const [previewEnabled, setPreviewEnabled] = useState(showPreview);

  const commonSymbols = [
    { label: 'x²', latex: 'x^2' },
    { label: '√', latex: '\\sqrt{}' },
    { label: 'π', latex: '\\pi' },
    { label: '±', latex: '\\pm' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' },
    { label: '≠', latex: '\\neq' },
    { label: '÷', latex: '\\div' },
    { label: '×', latex: '\\times' },
    { label: 'Frac', latex: '\\frac{}{}' },
  ];

  const insertSymbol = (symbol: string) => {
    const textarea = document.getElementById('math-input') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + symbol + value.substring(end);
      onChange(newValue);

      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + symbol.length, start + symbol.length);
      }, 0);
    } else {
      onChange(value + symbol);
    }
  };

  const renderPreview = () => {
    try {
      return <InlineMath math={value} />;
    } catch (error) {
      return <span className="text-red-500 text-sm">Invalid LaTeX syntax</span>;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Symbol Palette */}
      <div className="p-2 bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-500">Quick Insert:</p>
          <button
            type="button"
            onClick={() => setPreviewEnabled(!previewEnabled)}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title={previewEnabled ? 'Hide Preview' : 'Show Preview'}
          >
            {previewEnabled ? (
              <EyeOff className="w-3 h-3 text-slate-600" />
            ) : (
              <Eye className="w-3 h-3 text-slate-600" />
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {commonSymbols.map((symbol) => (
            <button
              key={symbol.latex}
              type="button"
              onClick={() => insertSymbol(symbol.latex)}
              disabled={disabled}
              className="px-2 py-1 text-sm bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={symbol.latex}
            >
              {symbol.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <textarea
        id="math-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed resize-none"
      />

      {/* Preview */}
      {previewEnabled && value && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 mb-1">Preview:</p>
          <div className="text-lg">{renderPreview()}</div>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-slate-500">
        Use LaTeX notation or click symbols above. Example: x^2 for x²
      </p>
    </div>
  );
};
