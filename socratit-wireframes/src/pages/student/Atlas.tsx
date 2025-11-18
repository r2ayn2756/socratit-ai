import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Map, AlertCircle, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import Confetti from 'react-confetti';
import { DashboardLayout } from '../../components/layout';
import SubjectProgressFlow from '../../components/atlas/SubjectProgressFlow';
import ConceptDetailPanel from '../../components/atlas/ConceptDetailPanel';
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
// WebSocket event interfaces
interface MasteryUpdateEvent {
  conceptId: string;
  conceptName: string;
  mastery: number;
  masteryLevel: string;
  trend: string;
  timestamp: string;
}

interface ConceptDiscoveredEvent {
  conceptId: string;
  conceptName: string;
  subject: string;
  timestamp: string;
}

interface MilestoneEvent {
  conceptId: string;
  conceptName: string;
  milestoneType: string;
  classId?: string;
  timestamp: string;
}

interface ConceptsDiscussedEvent {
  conceptIds: string[];
  conversationId: string;
  timestamp: string;
}

// Mock data for demonstration purposes
const MOCK_KNOWLEDGE_GRAPH: KnowledgeGraph = {
  nodes: [
    // Mathematics - Algebra track
    { id: '1', label: 'Variables & Expressions', subject: 'Mathematics', mastery: 95, masteryLevel: 'MASTERED', trend: 'STABLE', firstLearned: '2023-09-01', lastPracticed: '2024-11-15', classHistory: [{ className: 'Algebra I', gradeLevel: '8th', schoolYear: '2023-2024', masteryInClass: 95 }], attemptStats: { total: 45, correct: 43, incorrect: 2 } },
    { id: '2', label: 'Linear Equations', subject: 'Mathematics', mastery: 88, masteryLevel: 'PROFICIENT', trend: 'IMPROVING', firstLearned: '2023-09-15', lastPracticed: '2024-11-14', classHistory: [{ className: 'Algebra I', gradeLevel: '8th', schoolYear: '2023-2024', masteryInClass: 88 }], attemptStats: { total: 38, correct: 34, incorrect: 4 } },
    { id: '3', label: 'Quadratic Equations', subject: 'Mathematics', mastery: 72, masteryLevel: 'PROFICIENT', trend: 'IMPROVING', firstLearned: '2024-01-10', lastPracticed: '2024-11-13', classHistory: [{ className: 'Algebra I', gradeLevel: '8th', schoolYear: '2023-2024', masteryInClass: 72 }], attemptStats: { total: 28, correct: 20, incorrect: 8 } },
    { id: '4', label: 'Systems of Equations', subject: 'Mathematics', mastery: 65, masteryLevel: 'DEVELOPING', trend: 'STABLE', firstLearned: '2024-03-05', lastPracticed: '2024-11-10', classHistory: [{ className: 'Algebra I', gradeLevel: '8th', schoolYear: '2023-2024', masteryInClass: 65 }], attemptStats: { total: 20, correct: 13, incorrect: 7 } },
    { id: '5', label: 'Polynomials', subject: 'Mathematics', mastery: 45, masteryLevel: 'INTRODUCED', trend: 'IMPROVING', firstLearned: '2024-10-01', lastPracticed: '2024-11-12', classHistory: [{ className: 'Algebra II', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 45 }], attemptStats: { total: 12, correct: 5, incorrect: 7 } },

    // Science - Physics track
    { id: '6', label: 'Newton\'s Laws', subject: 'Science', mastery: 92, masteryLevel: 'MASTERED', trend: 'STABLE', firstLearned: '2024-01-15', lastPracticed: '2024-11-08', classHistory: [{ className: 'Physics', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 92 }], attemptStats: { total: 35, correct: 32, incorrect: 3 } },
    { id: '7', label: 'Forces & Motion', subject: 'Science', mastery: 85, masteryLevel: 'PROFICIENT', trend: 'IMPROVING', firstLearned: '2024-02-01', lastPracticed: '2024-11-11', classHistory: [{ className: 'Physics', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 85 }], attemptStats: { total: 30, correct: 26, incorrect: 4 } },
    { id: '8', label: 'Energy & Work', subject: 'Science', mastery: 68, masteryLevel: 'DEVELOPING', trend: 'IMPROVING', firstLearned: '2024-09-01', lastPracticed: '2024-11-09', classHistory: [{ className: 'Physics', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 68 }], attemptStats: { total: 18, correct: 12, incorrect: 6 } },
    { id: '9', label: 'Momentum', subject: 'Science', mastery: 42, masteryLevel: 'INTRODUCED', trend: 'STABLE', firstLearned: '2024-10-15', lastPracticed: '2024-11-07', classHistory: [{ className: 'Physics', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 42 }], attemptStats: { total: 10, correct: 4, incorrect: 6 } },

    // English - Writing track
    { id: '10', label: 'Thesis Statements', subject: 'English', mastery: 90, masteryLevel: 'PROFICIENT', trend: 'STABLE', firstLearned: '2023-10-01', lastPracticed: '2024-11-05', classHistory: [{ className: 'English 9', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 90 }], attemptStats: { total: 25, correct: 23, incorrect: 2 } },
    { id: '11', label: 'Literary Analysis', subject: 'English', mastery: 78, masteryLevel: 'PROFICIENT', trend: 'IMPROVING', firstLearned: '2024-01-20', lastPracticed: '2024-11-06', classHistory: [{ className: 'English 9', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 78 }], attemptStats: { total: 22, correct: 17, incorrect: 5 } },
    { id: '12', label: 'Rhetorical Devices', subject: 'English', mastery: 55, masteryLevel: 'DEVELOPING', trend: 'IMPROVING', firstLearned: '2024-09-10', lastPracticed: '2024-11-04', classHistory: [{ className: 'English 9', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 55 }], attemptStats: { total: 15, correct: 8, incorrect: 7 } },

    // History
    { id: '13', label: 'American Revolution', subject: 'History', mastery: 88, masteryLevel: 'PROFICIENT', trend: 'STABLE', firstLearned: '2024-02-10', lastPracticed: '2024-11-03', classHistory: [{ className: 'US History', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 88 }], attemptStats: { total: 20, correct: 18, incorrect: 2 } },
    { id: '14', label: 'Constitution', subject: 'History', mastery: 75, masteryLevel: 'PROFICIENT', trend: 'IMPROVING', firstLearned: '2024-03-01', lastPracticed: '2024-11-02', classHistory: [{ className: 'US History', gradeLevel: '9th', schoolYear: '2024-2025', masteryInClass: 75 }], attemptStats: { total: 18, correct: 14, incorrect: 4 } },
  ],
  edges: [
    // Math prerequisite chain
    { id: 'e1', source: '1', target: '2', type: 'prerequisite', strength: 1.0, label: 'Required for' },
    { id: 'e2', source: '2', target: '3', type: 'prerequisite', strength: 0.9, label: 'Required for' },
    { id: 'e3', source: '2', target: '4', type: 'prerequisite', strength: 0.8, label: 'Required for' },
    { id: 'e4', source: '3', target: '5', type: 'builds_upon', strength: 0.7, label: 'Builds upon' },

    // Science prerequisite chain
    { id: 'e5', source: '6', target: '7', type: 'prerequisite', strength: 1.0, label: 'Required for' },
    { id: 'e6', source: '7', target: '8', type: 'builds_upon', strength: 0.8, label: 'Builds upon' },
    { id: 'e7', source: '7', target: '9', type: 'builds_upon', strength: 0.9, label: 'Builds upon' },

    // English prerequisite chain
    { id: 'e8', source: '10', target: '11', type: 'prerequisite', strength: 0.9, label: 'Required for' },
    { id: 'e9', source: '11', target: '12', type: 'builds_upon', strength: 0.7, label: 'Builds upon' },

    // History chain
    { id: 'e10', source: '13', target: '14', type: 'builds_upon', strength: 0.8, label: 'Builds upon' },

    // Cross-subject connections
    { id: 'e11', source: '2', target: '6', type: 'applied_in', strength: 0.6, label: 'Applied in' },
    { id: 'e12', source: '3', target: '8', type: 'applied_in', strength: 0.5, label: 'Applied in' },
    { id: 'e13', source: '10', target: '11', type: 'prerequisite', strength: 0.8, label: 'Required for' },
    { id: 'e14', source: '11', target: '13', type: 'related', strength: 0.4, label: 'Related to' },
  ],
  metadata: {
    totalConcepts: 14,
    masteredConcepts: 3,
    inProgressConcepts: 8,
    notStartedConcepts: 3,
    overallProgress: 72.5,
  },
};

const Atlas: React.FC = () => {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState<KnowledgeGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AtlasFilters>({});
  const [highlightedConcepts, setHighlightedConcepts] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const animatingNodes = useRef<Set<string>>(new Set());

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

        // If no real data, use mock data for demonstration
        if (!data || data.nodes.length === 0) {
          console.log('[Atlas] No real data available, using mock data for demonstration');
          setGraphData(MOCK_KNOWLEDGE_GRAPH);
        } else {
          setGraphData(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch knowledge graph:', err);
        console.log('[Atlas] Using mock data for demonstration due to error');
        // Use mock data instead of showing error
        setGraphData(MOCK_KNOWLEDGE_GRAPH);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [user?.id, filters]);

  // ============================================================================
  // REAL-TIME WEBSOCKET EVENT HANDLERS
  // ============================================================================

  // Animate node update
  const animateNode = useCallback((nodeId: string) => {
    if (animatingNodes.current.has(nodeId)) return;

    animatingNodes.current.add(nodeId);
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);

    if (nodeElement) {
      nodeElement.animate(
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.15)', opacity: 0.9 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        {
          duration: 600,
          easing: 'ease-in-out',
        }
      );
    }

    setTimeout(() => {
      animatingNodes.current.delete(nodeId);
    }, 600);
  }, []);

  // Handle mastery update event
  const handleMasteryUpdate = useCallback((data: MasteryUpdateEvent) => {
    console.log('[Atlas] Mastery updated:', data);

    setGraphData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === data.conceptId
            ? {
                ...node,
                mastery: data.mastery,
                masteryLevel: data.masteryLevel as any,
                trend: data.trend as any,
                lastPracticed: data.timestamp,
              }
            : node
        ),
      };
    });

    animateNode(data.conceptId);

    toast.success(
      `${data.conceptName}: ${Math.round(data.mastery)}%`,
      {
        icon: data.trend === 'IMPROVING' ? '📈' : data.trend === 'DECLINING' ? '📉' : '➡️',
        duration: 3000,
      }
    );
  }, [animateNode]);

  // Handle concept discovered event
  const handleConceptDiscovered = useCallback((data: ConceptDiscoveredEvent) => {
    console.log('[Atlas] Concept discovered:', data);

    toast.success(`🎯 New concept: ${data.conceptName}`, {
      duration: 4000,
    });

    // Refetch graph to include new concept
    if (user?.id) {
      knowledgeGraphService.getStudentKnowledgeGraph(user.id, {
        filterSubject: filters.subject,
        filterMasteryLevel: filters.masteryLevel,
        includeHistory: filters.showHistory,
      }).then((data) => {
        setGraphData(data);
      }).catch(console.error);
    }
  }, [user?.id, filters]);

  // Handle milestone achieved event
  const handleMilestoneAchieved = useCallback((data: MilestoneEvent) => {
    console.log('[Atlas] Milestone achieved:', data);

    if (data.milestoneType === 'MASTERED') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      toast.success(`🎉 You mastered ${data.conceptName}!`, {
        duration: 6000,
        icon: '🏆',
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 600,
        },
      });
    } else if (data.milestoneType === 'FIRST_INTRODUCED') {
      toast(`🌱 First time learning: ${data.conceptName}`, {
        duration: 4000,
        icon: '✨',
      });
    }

    animateNode(data.conceptId);
  }, [animateNode]);

  // Handle concepts discussed in AI chat
  const handleConceptsDiscussed = useCallback((data: ConceptsDiscussedEvent) => {
    console.log('[Atlas] Concepts discussed:', data);

    setHighlightedConcepts(data.conceptIds);

    toast(`💬 Discussing ${data.conceptIds.length} concept${data.conceptIds.length !== 1 ? 's' : ''}`, {
      duration: 3000,
      icon: '🤖',
    });

    // Auto-clear highlights after 10 seconds
    setTimeout(() => {
      setHighlightedConcepts([]);
    }, 10000);
  }, []);

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  useEffect(() => {
    if (!user?.id) return;

    // Get base URL without /api/v1 path for WebSocket connection
    const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1').replace('/api/v1', '');
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn('[Atlas] No auth token found, skipping WebSocket connection');
      return;
    }

    console.log('[Atlas] Connecting to WebSocket...');

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Atlas] WebSocket connected');
      socket.emit('atlas:join');
    });

    socket.on('disconnect', () => {
      console.log('[Atlas] WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[Atlas] WebSocket connection error:', error);
    });

    // Listen for Atlas events
    socket.on('atlas:mastery:updated', handleMasteryUpdate);
    socket.on('atlas:concept:discovered', handleConceptDiscovered);
    socket.on('atlas:milestone:achieved', handleMilestoneAchieved);
    socket.on('atlas:concepts:discussed', handleConceptsDiscussed);

    // Cleanup
    return () => {
      console.log('[Atlas] Disconnecting WebSocket...');
      socket.emit('atlas:leave');
      socket.off('atlas:mastery:updated', handleMasteryUpdate);
      socket.off('atlas:concept:discovered', handleConceptDiscovered);
      socket.off('atlas:milestone:achieved', handleMilestoneAchieved);
      socket.off('atlas:concepts:discussed', handleConceptsDiscussed);
      socket.disconnect();
    };
  }, [user?.id, handleMasteryUpdate, handleConceptDiscovered, handleMilestoneAchieved, handleConceptsDiscussed]);

  // ============================================================================
  // UI INTERACTIONS
  // ============================================================================

  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    if (!graphData) return;
    const node = graphData.nodes.find((n) => n.id === nodeId);
    setSelectedNode(node || null);
  };

  // Get unique subjects for filter (currently not used, but available for future enhancements)
  const availableSubjects = graphData
    ? Array.from(new Set(graphData.nodes.map((n) => n.subject)))
    : [];

  if (loading) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading your Atlas...</h2>
            <p className="text-gray-600 mt-2">Mapping your knowledge across all subjects</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="student">
        <div className="flex items-center justify-center h-64">
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
      </DashboardLayout>
    );
  }

  // No empty state check needed - we'll always show mock data if no real data exists

  if (!graphData) {
    return null; // Should never happen due to mock data fallback
  }

  return (
    <DashboardLayout userRole="student">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }}
      />

      {/* Celebration Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <div className="flex flex-col h-full">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
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
            <div className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg">
              <span className="text-xs font-semibold text-purple-700">DEMO DATA</span>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <KnowledgeStats metadata={graphData.metadata} />

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            {filters.subject && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                <span>Subject: {filters.subject}</span>
                <button
                  onClick={() => setFilters({ ...filters, subject: undefined })}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </div>
            )}
            {filters.masteryLevel && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                <span>Mastery: {filters.masteryLevel}</span>
                <button
                  onClick={() => setFilters({ ...filters, masteryLevel: undefined })}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </div>
            )}
            {(filters.subject || filters.masteryLevel) && (
              <button
                onClick={() => setFilters({})}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Main Content: Subject Progress Flow + Detail Panel */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Subject Progress Flow */}
          <div className="flex-1 relative">
            <SubjectProgressFlow
              nodes={graphData.nodes}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
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
    </DashboardLayout>
  );
};

export default Atlas;
