import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import ConceptNode from './ConceptNode';
import { KnowledgeGraphNode, KnowledgeGraphEdge } from '../../services/knowledgeGraph.service';
import knowledgeGraphService from '../../services/knowledgeGraph.service';

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

  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      conceptNode: ConceptNode,
    }),
    []
  );

  // Transform graph data to React Flow format
  useEffect(() => {
    if (!graphData) return;

    // Convert nodes
    const flowNodes: Node[] = graphData.nodes.map((node) => ({
      id: node.id,
      type: 'conceptNode',
      position: node.position || { x: 0, y: 0 },
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
    }));

    // Convert edges
    const flowEdges: Edge[] = graphData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: edge.type === 'prerequisite', // Animate prerequisites
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

    // Apply layout if enabled
    if (layout === 'hierarchical' && !isLayouted) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        flowNodes,
        flowEdges,
        'TB'
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouted(true);
    } else {
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [graphData, layout, setNodes, setEdges, isLayouted, highlightedConcepts]);

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

  // Save node position when dragging ends
  const onNodeDragStop = useCallback(
    async (_event: React.MouseEvent, node: Node) => {
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
    [studentId]
  );

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden">
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
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
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
