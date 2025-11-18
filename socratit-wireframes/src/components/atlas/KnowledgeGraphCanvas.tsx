import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  MarkerType,
  ConnectionLineType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import ConceptNode from './ConceptNode';
import { KnowledgeGraphNode, KnowledgeGraphEdge } from '../../services/knowledgeGraph.service';
import knowledgeGraphService from '../../services/knowledgeGraph.service';
import { useForceLayout } from '../../hooks/useForceLayout';

interface KnowledgeGraphCanvasProps {
  graphData: {
    nodes: KnowledgeGraphNode[];
    edges: KnowledgeGraphEdge[];
  };
  onNodeClick: (nodeId: string) => void;
  layout?: 'hierarchical' | 'force';
  studentId: string;
  highlightedConcepts?: string[];
}

/**
 * Layout graph using Dagre for hierarchical positioning
 * Groups nodes by subject and spreads them out to prevent bunching
 */
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
) => {
  // Group nodes by subject
  const nodesBySubject = new Map<string, Node[]>();
  nodes.forEach((node) => {
    const subject = node.data.subject || 'Other';
    if (!nodesBySubject.has(subject)) {
      nodesBySubject.set(subject, []);
    }
    nodesBySubject.get(subject)!.push(node);
  });

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // Increase spacing to prevent bunching: nodesep controls horizontal spacing, ranksep controls vertical
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 200,  // Increased from 100
    ranksep: 250,  // Increased from 150
    marginx: 50,
    marginy: 50
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Apply subject-based horizontal offset to spread subjects apart
  const subjects = Array.from(nodesBySubject.keys());
  const subjectOffsets = new Map<string, number>();
  subjects.forEach((subject, index) => {
    subjectOffsets.set(subject, index * 400); // 400px offset between subject columns
  });

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const subject = node.data.subject || 'Other';
    const subjectOffset = subjectOffsets.get(subject) || 0;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 125 + subjectOffset, // Center the node + subject offset
        y: nodeWithPosition.y - 60,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Get edge color based on relationship type
 */
const getEdgeColor = (type: string): string => {
  switch (type) {
    case 'prerequisite':
      return '#ef4444'; // Red - critical dependency
    case 'builds_upon':
      return '#3b82f6'; // Blue - enhancement
    case 'applied_in':
      return '#10b981'; // Green - application
    case 'related':
      return '#8b5cf6'; // Purple - conceptual link
    default:
      return '#6b7280'; // Gray
  }
};

/**
 * Get edge style based on strength
 */
const getEdgeStyle = (strength: number, type: string) => {
  return {
    stroke: getEdgeColor(type),
    strokeWidth: Math.max(1, strength * 3),
    opacity: 0.6 + (strength * 0.4),
  };
};

/**
 * Knowledge Graph Canvas Component
 * Interactive React Flow visualization of student's knowledge graph
 */
const KnowledgeGraphCanvas: React.FC<KnowledgeGraphCanvasProps> = ({
  graphData,
  onNodeClick,
  layout = 'hierarchical',
  studentId,
  highlightedConcepts = [],
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLayouted, setIsLayouted] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1000, height: 800 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      conceptNode: ConceptNode,
    }),
    []
  );

  // Track canvas dimensions for force layout centering
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setCanvasDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Prepare initial flow nodes and edges (before layout)
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!graphData) return { flowNodes: [], flowEdges: [] };

    const flowNodes: Node[] = graphData.nodes.map((node) => ({
      id: node.id,
      type: 'conceptNode',
      position: node.position || { x: Math.random() * canvasDimensions.width, y: Math.random() * canvasDimensions.height },
      data: {
        label: node.label,
        subject: node.subject,
        mastery: node.mastery,
        masteryLevel: node.masteryLevel,
        trend: node.trend,
        attemptStats: node.attemptStats,
        isHighlighted: highlightedConcepts.includes(node.id),
      },
      className: highlightedConcepts.includes(node.id) ? 'highlighted-concept' : '',
      // Smaller dimensions for dot nodes
      width: 12,
      height: 12,
    }));

    const flowEdges: Edge[] = graphData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'straight', // Changed from 'smoothstep' to 'straight' for direct connections
      animated: edge.type === 'prerequisite',
      style: getEdgeStyle(edge.strength, edge.type),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: getEdgeColor(edge.type),
      },
      label: edge.label,
      labelStyle: { fill: '#64748b', fontSize: 10, fontWeight: 500 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
    }));

    return { flowNodes, flowEdges };
  }, [graphData, highlightedConcepts, canvasDimensions]);

  // Apply force layout when enabled
  const forceLayoutResult = useForceLayout(
    flowNodes,
    flowEdges,
    canvasDimensions,
    {
      repulsion: -600, // Reduced repulsion for tighter clustering
      linkDistance: 80, // Shorter links for tighter connections
      linkStrength: 1.0, // Maximum link strength
      collisionPadding: 8, // Minimal padding for dot nodes
      centerStrength: 0.8, // Very strong pull toward center (doubled)
    }
  );

  // Apply layout based on mode and update nodes/edges
  useEffect(() => {
    if (!flowNodes.length) return;

    if (layout === 'force') {
      // Use force-directed layout from hook
      setNodes(forceLayoutResult.nodes);
      setEdges(flowEdges);
      setIsLayouted(false); // Reset for potential switch back to hierarchical
    } else if (layout === 'hierarchical') {
      // Use hierarchical dagre layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        flowNodes,
        flowEdges,
        'TB'
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouted(true);
    }
  }, [layout, flowNodes, flowEdges, forceLayoutResult.nodes, setNodes, setEdges]);

  // Handle connection (for future editing features)
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  // Handle node drag start (for force layout)
  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (layout === 'force' && forceLayoutResult.handleNodeDragStart) {
        forceLayoutResult.handleNodeDragStart(node.id);
      }
    },
    [layout, forceLayoutResult]
  );

  // Handle node drag (for force layout)
  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (layout === 'force' && forceLayoutResult.handleNodeDrag) {
        forceLayoutResult.handleNodeDrag(node.id, node.position);
      }
    },
    [layout, forceLayoutResult]
  );

  // Save node position when dragging ends
  const onNodeDragStop = useCallback(
    async (_event: React.MouseEvent, node: Node) => {
      // End force simulation drag
      if (layout === 'force' && forceLayoutResult.handleNodeDragEnd) {
        forceLayoutResult.handleNodeDragEnd(node.id);
      }

      // Save position to backend
      try {
        await knowledgeGraphService.updateNodePosition(
          studentId,
          node.id,
          node.position.x,
          node.position.y
        );
      } catch (error) {
        console.error('Failed to save node position:', error);
      }
    },
    [studentId, layout, forceLayoutResult]
  );

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      <style>{`
        .highlighted-concept {
          filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.8));
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 30px rgba(59, 130, 246, 1));
          }
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.Straight}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-left"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#cbd5e1"
        />
        <Controls
          showInteractive={false}
          className="bg-white rounded-lg shadow-lg border border-gray-200"
        />
      </ReactFlow>
    </div>
  );
};

export default KnowledgeGraphCanvas;
