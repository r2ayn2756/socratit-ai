import React, { useEffect, useState } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BookOpen,
  Target,
  Clock,
  Award,
} from 'lucide-react';
import knowledgeGraphService, {
  KnowledgeGraphNode,
  ConceptTimeline,
} from '../../services/knowledgeGraph.service';
import { format } from 'date-fns';

interface ConceptDetailPanelProps {
  conceptNode: KnowledgeGraphNode | null;
  studentId: string;
  onClose: () => void;
}

/**
 * Get trend icon and color
 */
const getTrendInfo = (trend: string) => {
  switch (trend) {
    case 'IMPROVING':
      return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', label: 'Improving' };
    case 'DECLINING':
      return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100', label: 'Needs Review' };
    case 'STABLE':
      return { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Stable' };
    default:
      return { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
  }
};

/**
 * Get mastery level badge color
 */
const getMasteryBadgeColor = (level: string) => {
  switch (level) {
    case 'EXPERT':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'MASTERED':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'PROFICIENT':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'DEVELOPING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'INTRODUCED':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'NOT_STARTED':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

/**
 * Concept Detail Panel Component
 * Sidebar showing detailed information about selected concept
 */
const ConceptDetailPanel: React.FC<ConceptDetailPanelProps> = ({
  conceptNode,
  studentId,
  onClose,
}) => {
  const [timeline, setTimeline] = useState<ConceptTimeline | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch timeline when concept changes
  useEffect(() => {
    if (!conceptNode) {
      setTimeline(null);
      return;
    }

    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const data = await knowledgeGraphService.getConceptTimeline(
          studentId,
          conceptNode.id
        );
        setTimeline(data);
      } catch (error) {
        console.error('Failed to fetch timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [conceptNode, studentId]);

  if (!conceptNode) {
    return null;
  }

  const trendInfo = getTrendInfo(conceptNode.trend);
  const TrendIcon = trendInfo.icon;
  const accuracyPercent = conceptNode.attemptStats.total > 0
    ? Math.round((conceptNode.attemptStats.correct / conceptNode.attemptStats.total) * 100)
    : 0;

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{conceptNode.label}</h2>
            <p className="text-sm text-gray-600 mt-1">{conceptNode.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mastery Badge */}
        <div className="mt-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getMasteryBadgeColor(
              conceptNode.masteryLevel
            )}`}
          >
            {conceptNode.masteryLevel.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Mastery Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Overall Mastery</h3>
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(conceptNode.mastery)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-blue-600"
              style={{ width: `${conceptNode.mastery}%` }}
            />
          </div>
        </div>

        {/* Trend */}
        <div className={`p-3 rounded-lg ${trendInfo.bg}`}>
          <div className="flex items-center gap-2">
            <TrendIcon className={`w-5 h-5 ${trendInfo.color}`} />
            <span className={`text-sm font-medium ${trendInfo.color}`}>
              {trendInfo.label}
            </span>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{accuracyPercent}%</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium">Attempts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {conceptNode.attemptStats.total}
            </p>
          </div>
        </div>

        {/* Timeline Dates */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">First Learned</p>
              <p className="text-sm text-gray-600">
                {conceptNode.firstLearned
                  ? format(new Date(conceptNode.firstLearned), 'MMM d, yyyy')
                  : 'Not yet assessed'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Last Practiced</p>
              <p className="text-sm text-gray-600">
                {conceptNode.lastPracticed
                  ? format(new Date(conceptNode.lastPracticed), 'MMM d, yyyy')
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Class History */}
        {conceptNode.classHistory && conceptNode.classHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Class History
            </h3>
            <div className="space-y-2">
              {conceptNode.classHistory.map((record, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {record.className}
                      </p>
                      <p className="text-xs text-gray-600">
                        {record.gradeLevel} • {record.schoolYear}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round(record.masteryInClass)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${record.masteryInClass}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Events */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-2">Loading timeline...</p>
          </div>
        )}

        {timeline && timeline.timeline && timeline.timeline.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Recent Activity
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeline.timeline.slice(0, 10).map((event, index) => (
                <div
                  key={index}
                  className="text-sm p-2 bg-gray-50 rounded border-l-4 border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{event.event}</span>
                    <span className="text-xs text-gray-600">
                      {Math.round(event.percent)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(new Date(event.date), 'MMM d, yyyy')} • {event.className}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptDetailPanel;
