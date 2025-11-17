import React, { useEffect, useState } from 'react';
import { Map, AlertCircle, Loader2 } from 'lucide-react';
import KnowledgeGraphCanvas from '../../components/atlas/KnowledgeGraphCanvas';
import ConceptDetailPanel from '../../components/atlas/ConceptDetailPanel';
import AtlasControls from '../../components/atlas/AtlasControls';
import KnowledgeStats from '../../components/atlas/KnowledgeStats';
import knowledgeGraphService, {
  KnowledgeGraph,
  KnowledgeGraphNode,
} from '../../services/knowledgeGraph.service';
import { AtlasFilters } from '../../types/knowledgeGraph';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Atlas Page
 * Multi-year knowledge tracking visualization for students
 * Interactive mind map showing mastery across all subjects and grades
 */
const Atlas: React.FC = () => {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState<KnowledgeGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AtlasFilters>({});
  const [layout, setLayout] = useState<'hierarchical' | 'force'>('hierarchical');

  // Fetch knowledge graph
  useEffect(() => {
    if (!user?.id) return;

    const fetchGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await knowledgeGraphService.getStudentKnowledgeGraph(
          user.id,
          {
            filterSubject: filters.subject,
            filterMasteryLevel: filters.masteryLevel,
            includeHistory: filters.showHistory,
          }
        );
        setGraphData(data);
      } catch (err: any) {
        console.error('Failed to fetch knowledge graph:', err);
        setError(err.response?.data?.message || 'Failed to load your knowledge graph');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [user?.id, filters]);

  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    if (!graphData) return;
    const node = graphData.nodes.find((n) => n.id === nodeId);
    setSelectedNode(node || null);
  };

  // Get unique subjects for filter
  const availableSubjects = graphData
    ? Array.from(new Set(graphData.nodes.map((n) => n.subject)))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading your Atlas...</h2>
          <p className="text-gray-600 mt-2">Mapping your knowledge across all subjects</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Atlas</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Atlas is Empty</h2>
          <p className="text-gray-600 mb-6">
            Your knowledge graph will appear here once you start completing assignments.
            Each concept you learn will be tracked and visualized!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-lg p-2">
            <Map className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Atlas</h1>
            <p className="text-sm text-gray-600">
              Your multi-year knowledge map • Tracking {graphData.metadata.totalConcepts} concepts
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <KnowledgeStats metadata={graphData.metadata} />

      {/* Filters and Controls */}
      <AtlasControls
        filters={filters}
        onFiltersChange={setFilters}
        availableSubjects={availableSubjects}
        layout={layout}
        onLayoutChange={setLayout}
      />

      {/* Main Content: Graph + Detail Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Knowledge Graph Canvas */}
        <div className="flex-1 relative">
          <KnowledgeGraphCanvas
            graphData={graphData}
            onNodeClick={handleNodeClick}
            layout={layout}
            studentId={user?.id || ''}
          />
        </div>

        {/* Detail Panel (shows when node selected) */}
        {selectedNode && (
          <ConceptDetailPanel
            conceptNode={selectedNode}
            studentId={user?.id || ''}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Mastered (≥90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Proficient (70-89%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Developing (50-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Introduced (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Not Started</span>
          </div>
          <div className="border-l border-gray-300 h-4 mx-2"></div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-500"></div>
            <span>Prerequisites</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-500"></div>
            <span>Builds Upon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-purple-500"></div>
            <span>Related</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Atlas;
