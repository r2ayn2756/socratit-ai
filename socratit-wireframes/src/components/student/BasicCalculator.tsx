// ============================================================================
// BASIC CALCULATOR COMPONENT
// Simple arithmetic calculator for students
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface BasicCalculatorProps {
  onClose?: () => void;
  className?: string;
}

export const BasicCalculator: React.FC<BasicCalculatorProps> = ({
  onClose,
  className = '',
}) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(display);

    if (previousValue !== null && operation && !newNumber) {
      // Calculate the result before setting new operation
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(result.toString());
      setPreviousValue(result);
    } else {
      setPreviousValue(currentValue);
    }

    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + current;
      case '-':
        return prev - current;
      case '×':
        return prev * current;
      case '÷':
        return current !== 0 ? prev / current : 0;
      case '%':
        return prev % current;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const currentValue = parseFloat(display);
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(result.toString());
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const handleFunction = (func: string) => {
    const currentValue = parseFloat(display);
    let result: number;

    switch (func) {
      case '√':
        result = Math.sqrt(currentValue);
        break;
      case 'x²':
        result = currentValue * currentValue;
        break;
      case '±':
        result = -currentValue;
        break;
      default:
        result = currentValue;
    }

    setDisplay(result.toString());
    setNewNumber(true);
  };

  const buttonClass = (variant: 'number' | 'operation' | 'function' | 'equals' | 'clear' = 'number') => {
    const baseClass = 'p-4 rounded-lg font-semibold text-lg transition-all duration-200 active:scale-95';

    switch (variant) {
      case 'operation':
        return `${baseClass} bg-blue-500 hover:bg-blue-600 text-white`;
      case 'function':
        return `${baseClass} bg-slate-200 hover:bg-slate-300 text-slate-700`;
      case 'equals':
        return `${baseClass} bg-green-500 hover:bg-green-600 text-white`;
      case 'clear':
        return `${baseClass} bg-red-500 hover:bg-red-600 text-white`;
      default:
        return `${baseClass} bg-white hover:bg-slate-50 text-slate-900 border border-slate-200`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-xl border border-slate-200 p-4 ${className}`}
      style={{ width: '320px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Calculator</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded transition-colors"
            aria-label="Close calculator"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Display */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-slate-300 shadow-inner">
        <div className="text-right">
          {operation && previousValue !== null && (
            <div className="text-sm text-slate-500 mb-1">
              {previousValue} {operation}
            </div>
          )}
          <div className="text-3xl font-bold text-slate-900 truncate" title={display}>
            {display}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: Functions */}
        <button onClick={handleClear} className={buttonClass('clear')}>
          C
        </button>
        <button onClick={handleBackspace} className={buttonClass('function')}>
          <Delete className="w-5 h-5 mx-auto" />
        </button>
        <button onClick={() => handleFunction('√')} className={buttonClass('function')}>
          √
        </button>
        <button onClick={() => handleOperation('÷')} className={buttonClass('operation')}>
          ÷
        </button>

        {/* Row 2: 7-8-9-× */}
        <button onClick={() => handleNumber('7')} className={buttonClass()}>
          7
        </button>
        <button onClick={() => handleNumber('8')} className={buttonClass()}>
          8
        </button>
        <button onClick={() => handleNumber('9')} className={buttonClass()}>
          9
        </button>
        <button onClick={() => handleOperation('×')} className={buttonClass('operation')}>
          ×
        </button>

        {/* Row 3: 4-5-6-- */}
        <button onClick={() => handleNumber('4')} className={buttonClass()}>
          4
        </button>
        <button onClick={() => handleNumber('5')} className={buttonClass()}>
          5
        </button>
        <button onClick={() => handleNumber('6')} className={buttonClass()}>
          6
        </button>
        <button onClick={() => handleOperation('-')} className={buttonClass('operation')}>
          -
        </button>

        {/* Row 4: 1-2-3-+ */}
        <button onClick={() => handleNumber('1')} className={buttonClass()}>
          1
        </button>
        <button onClick={() => handleNumber('2')} className={buttonClass()}>
          2
        </button>
        <button onClick={() => handleNumber('3')} className={buttonClass()}>
          3
        </button>
        <button onClick={() => handleOperation('+')} className={buttonClass('operation')}>
          +
        </button>

        {/* Row 5: Special functions and 0 */}
        <button onClick={() => handleFunction('±')} className={buttonClass('function')}>
          ±
        </button>
        <button onClick={() => handleNumber('0')} className={buttonClass()}>
          0
        </button>
        <button onClick={handleDecimal} className={buttonClass()}>
          .
        </button>
        <button onClick={handleEquals} className={buttonClass('equals')}>
          =
        </button>
      </div>

      {/* Additional Functions */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <button onClick={() => handleFunction('x²')} className={buttonClass('function')}>
          x²
        </button>
        <button onClick={() => handleOperation('%')} className={buttonClass('function')}>
          %
        </button>
        <button
          onClick={() => {
            setDisplay(Math.PI.toString());
            setNewNumber(true);
          }}
          className={buttonClass('function')}
        >
          π
        </button>
      </div>
    </motion.div>
  );
};
