import React from 'react';
import { Brain, TrendingUp, BookOpen, Target } from 'lucide-react';
import { GraphMetadata } from '../../types/knowledgeGraph';

interface KnowledgeStatsProps {
  metadata: GraphMetadata;
}

/**
 * Knowledge Stats Component
 * Display overview statistics for student's knowledge graph
 */
const KnowledgeStats: React.FC<KnowledgeStatsProps> = ({ metadata }) => {
  const progressPercent = metadata.overallProgress;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Progress */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-lg p-2.5">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                Overall Progress
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-0.5">
                {Math.round(progressPercent)}%
              </p>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden mt-3">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Total Concepts */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 rounded-lg p-2.5">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                Total Concepts
              </p>
              <p className="text-2xl font-bold text-purple-900 mt-0.5">
                {metadata.totalConcepts}
              </p>
            </div>
          </div>
          <p className="text-xs text-purple-700 mt-2">
            Tracked across all subjects
          </p>
        </div>

        {/* Mastered Concepts */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-lg p-2.5">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide">
                Mastered
              </p>
              <p className="text-2xl font-bold text-green-900 mt-0.5">
                {metadata.masteredConcepts}
              </p>
            </div>
          </div>
          <p className="text-xs text-green-700 mt-2">
            {metadata.totalConcepts > 0
              ? Math.round((metadata.masteredConcepts / metadata.totalConcepts) * 100)
              : 0}
            % of total concepts
          </p>
        </div>

        {/* In Progress */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 rounded-lg p-2.5">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                In Progress
              </p>
              <p className="text-2xl font-bold text-orange-900 mt-0.5">
                {metadata.inProgressConcepts}
              </p>
            </div>
          </div>
          <p className="text-xs text-orange-700 mt-2">
            Actively learning
          </p>
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-700">
              Mastered: <span className="font-semibold">{metadata.masteredConcepts}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-700">
              Proficient: <span className="font-semibold">{metadata.inProgressConcepts}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-gray-700">
              Not Started: <span className="font-semibold">{metadata.notStartedConcepts}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeStats;
