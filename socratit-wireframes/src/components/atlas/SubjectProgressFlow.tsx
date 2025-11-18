import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { KnowledgeGraphNode } from '../../services/knowledgeGraph.service';

interface SubjectProgressFlowProps {
  nodes: KnowledgeGraphNode[];
  onNodeClick: (nodeId: string) => void;
  selectedNodeId?: string;
}

/**
 * SubjectProgressFlow
 * Clean linear visualization showing mastery progression through subjects
 * Each subject flows into the next with clear mastery percentages
 */
const SubjectProgressFlow: React.FC<SubjectProgressFlowProps> = ({
  nodes,
  onNodeClick,
  selectedNodeId,
}) => {
  // Group nodes by subject
  const nodesBySubject = React.useMemo(() => {
    const grouped = new Map<string, KnowledgeGraphNode[]>();
    nodes.forEach((node) => {
      if (!grouped.has(node.subject)) {
        grouped.set(node.subject, []);
      }
      grouped.get(node.subject)!.push(node);
    });

    // Sort nodes within each subject by mastery (descending) for clean display
    grouped.forEach((subjectNodes) => {
      subjectNodes.sort((a, b) => b.mastery - a.mastery);
    });

    return grouped;
  }, [nodes]);

  // Calculate average mastery per subject
  const subjectAverages = React.useMemo(() => {
    const averages = new Map<string, number>();
    nodesBySubject.forEach((subjectNodes, subject) => {
      const avg =
        subjectNodes.reduce((sum, node) => sum + node.mastery, 0) / subjectNodes.length;
      averages.set(subject, avg);
    });
    return averages;
  }, [nodesBySubject]);

  const subjects = Array.from(nodesBySubject.keys());

  // Get mastery color
  const getMasteryColor = (mastery: number) => {
    if (mastery >= 90) return 'bg-green-500';
    if (mastery >= 70) return 'bg-blue-500';
    if (mastery >= 50) return 'bg-yellow-500';
    if (mastery > 0) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getMasteryTextColor = (mastery: number) => {
    if (mastery >= 90) return 'text-green-700';
    if (mastery >= 70) return 'text-blue-700';
    if (mastery >= 50) return 'text-yellow-700';
    if (mastery > 0) return 'text-orange-700';
    return 'text-gray-600';
  };

  const getMasteryBgColor = (mastery: number) => {
    if (mastery >= 90) return 'bg-green-50';
    if (mastery >= 70) return 'bg-blue-50';
    if (mastery >= 50) return 'bg-yellow-50';
    if (mastery > 0) return 'bg-orange-50';
    return 'bg-gray-50';
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {subjects.map((subject, subjectIndex) => {
          const subjectNodes = nodesBySubject.get(subject)!;
          const avgMastery = subjectAverages.get(subject)!;

          return (
            <div key={subject} className="mb-12">
              {/* Subject Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full ${getMasteryColor(
                      avgMastery
                    )} flex items-center justify-center shadow-lg`}
                  >
                    <span className="text-white font-bold text-xl">
                      {Math.round(avgMastery)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900">{subject}</h2>
                  <p className="text-sm text-gray-600">
                    {subjectNodes.length} concept{subjectNodes.length !== 1 ? 's' : ''} •{' '}
                    {Math.round(avgMastery)}% average mastery
                  </p>
                </div>
              </div>

              {/* Concepts Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectNodes.map((node, nodeIndex) => (
                  <button
                    key={node.id}
                    onClick={() => onNodeClick(node.id)}
                    className={`
                      ${getMasteryBgColor(node.mastery)}
                      border-2 rounded-xl p-4 text-left transition-all
                      hover:shadow-xl hover:scale-105 cursor-pointer
                      ${
                        selectedNodeId === node.id
                          ? 'ring-4 ring-blue-400 border-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {/* Concept Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2 flex-1">
                        {node.mastery >= 90 ? (
                          <CheckCircle2
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getMasteryTextColor(
                              node.mastery
                            )}`}
                          />
                        ) : (
                          <Circle
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getMasteryTextColor(
                              node.mastery
                            )}`}
                          />
                        )}
                        <h3 className="font-semibold text-gray-900 leading-tight">
                          {node.label}
                        </h3>
                      </div>
                      <span
                        className={`font-bold text-lg flex-shrink-0 ml-2 ${getMasteryTextColor(
                          node.mastery
                        )}`}
                      >
                        {Math.round(node.mastery)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white bg-opacity-60 rounded-full h-2.5 mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getMasteryColor(
                          node.mastery
                        )}`}
                        style={{ width: `${node.mastery}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {node.attemptStats.total} attempt
                        {node.attemptStats.total !== 1 ? 's' : ''}
                      </span>
                      {node.attemptStats.total > 0 && (
                        <span className="font-medium">
                          {Math.round(
                            (node.attemptStats.correct / node.attemptStats.total) * 100
                          )}
                          % accuracy
                        </span>
                      )}
                    </div>

                    {/* Mastery Level Badge */}
                    <div className="mt-3 pt-3 border-t border-gray-200 border-opacity-50">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          node.masteryLevel === 'MASTERED'
                            ? 'bg-green-100 text-green-700'
                            : node.masteryLevel === 'PROFICIENT'
                            ? 'bg-blue-100 text-blue-700'
                            : node.masteryLevel === 'DEVELOPING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : node.masteryLevel === 'INTRODUCED'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {node.masteryLevel.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Subject Connector Arrow (if not last subject) */}
              {subjectIndex < subjects.length - 1 && (
                <div className="flex justify-center my-8">
                  <div className="flex flex-col items-center">
                    <div className="w-1 h-12 bg-gradient-to-b from-gray-300 to-gray-400" />
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-400" />
                    <p className="text-xs font-medium text-gray-500 mt-2">PROGRESSES TO</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectProgressFlow;
