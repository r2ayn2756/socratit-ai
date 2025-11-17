import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MasteryLevel, TrendDirection } from '../../types/knowledgeGraph';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, Circle } from 'lucide-react';

interface ConceptNodeData {
  label: string;
  subject: string;
  mastery: number;
  masteryLevel: MasteryLevel;
  trend: TrendDirection;
  attemptStats: {
    total: number;
    correct: number;
    incorrect: number;
  };
}

/**
 * Get color based on mastery level
 */
const getMasteryColor = (masteryLevel: MasteryLevel): string => {
  switch (masteryLevel) {
    case 'EXPERT':
      return 'bg-purple-100 border-purple-500 text-purple-900';
    case 'MASTERED':
      return 'bg-green-100 border-green-500 text-green-900';
    case 'PROFICIENT':
      return 'bg-blue-100 border-blue-500 text-blue-900';
    case 'DEVELOPING':
      return 'bg-yellow-100 border-yellow-500 text-yellow-900';
    case 'INTRODUCED':
      return 'bg-orange-100 border-orange-500 text-orange-900';
    case 'NOT_STARTED':
      return 'bg-gray-100 border-gray-400 text-gray-700';
    default:
      return 'bg-gray-100 border-gray-400 text-gray-700';
  }
};

/**
 * Get mastery level icon
 */
const getMasteryIcon = (masteryLevel: MasteryLevel) => {
  switch (masteryLevel) {
    case 'EXPERT':
    case 'MASTERED':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'PROFICIENT':
    case 'DEVELOPING':
    case 'INTRODUCED':
      return <Circle className="w-4 h-4" />;
    case 'NOT_STARTED':
      return <Circle className="w-4 h-4 opacity-40" />;
    default:
      return <Circle className="w-4 h-4" />;
  }
};

/**
 * Get trend icon
 */
const getTrendIcon = (trend: TrendDirection) => {
  switch (trend) {
    case 'IMPROVING':
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    case 'DECLINING':
      return <TrendingDown className="w-3 h-3 text-red-600" />;
    case 'STABLE':
      return <Minus className="w-3 h-3 text-gray-500" />;
  }
};

/**
 * Custom Concept Node Component for React Flow
 * Displays concept with mastery level, trend, and statistics
 */
const ConceptNode = memo(({ data, selected }: NodeProps<ConceptNodeData>) => {
  const colorClasses = getMasteryColor(data.masteryLevel);
  const accuracyPercent = data.attemptStats.total > 0
    ? Math.round((data.attemptStats.correct / data.attemptStats.total) * 100)
    : 0;

  return (
    <>
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div
        className={`
          px-4 py-3 rounded-lg border-2 shadow-md min-w-[200px] max-w-[250px]
          transition-all duration-200 cursor-pointer
          ${colorClasses}
          ${selected ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105' : 'hover:shadow-lg'}
        `}
      >
        {/* Header: Icon + Label */}
        <div className="flex items-start gap-2 mb-2">
          <div className="mt-0.5">
            {getMasteryIcon(data.masteryLevel)}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm leading-tight">
              {data.label}
            </div>
            <div className="text-xs opacity-75 mt-0.5">
              {data.subject}
            </div>
          </div>
          <div className="mt-0.5">
            {getTrendIcon(data.trend)}
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">Mastery</span>
            <span className="font-bold">{Math.round(data.mastery)}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${data.mastery}%`,
                backgroundColor: data.mastery >= 90 ? '#10b981' :
                  data.mastery >= 70 ? '#3b82f6' :
                  data.mastery >= 50 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="flex items-center justify-between text-xs opacity-75">
          <span>
            {data.attemptStats.total} attempt{data.attemptStats.total !== 1 ? 's' : ''}
          </span>
          {data.attemptStats.total > 0 && (
            <span className="font-medium">
              {accuracyPercent}% accuracy
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </>
  );
});

ConceptNode.displayName = 'ConceptNode';

export default ConceptNode;
