/**
 * useForceLayout Hook
 *
 * Manages d3-force physics simulation for Obsidian-style graph layout.
 * Applies multiple forces to create natural, non-overlapping node positions:
 * - Repulsion: All nodes push away from each other
 * - Attraction: Connected nodes pull together
 * - Collision: Prevents nodes from overlapping (rectangular)
 * - Centering: Keeps graph centered in viewport
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import { Node, Edge } from 'reactflow';
import { rectangleCollide } from '../utils/rectangleCollide';

export interface ForceLayoutConfig {
  repulsion?: number;
  linkDistance?: number;
  linkStrength?: number;
  collisionPadding?: number;
  centerStrength?: number;
  alphaDecay?: number;
  velocityDecay?: number;
}

const DEFAULT_CONFIG: Required<ForceLayoutConfig> = {
  repulsion: -1500,
  linkDistance: 150,
  linkStrength: 0.5,
  collisionPadding: 20,
  centerStrength: 0.05,
  alphaDecay: 0.01,
  velocityDecay: 0.4,
};

export function useForceLayout(
  initialNodes: Node[],
  edges: Edge[],
  canvasDimensions: { width: number; height: number },
  config: ForceLayoutConfig = {}
) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const nodesRef = useRef(initialNodes);

  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    // Keep ref in sync
    nodesRef.current = initialNodes;
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    if (!initialNodes.length) return;

    // Convert React Flow nodes to d3 simulation nodes
    const simNodes = initialNodes.map((node) => ({
      id: node.id,
      x: node.position?.x ?? Math.random() * canvasDimensions.width,
      y: node.position?.y ?? Math.random() * canvasDimensions.height,
      fx: null, // Fixed positions (null = free to move)
      fy: null,
      vx: 0,
      vy: 0,
      width: 250,
      height: 120,
    }));

    // Convert React Flow edges to d3 links
    const simLinks = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      id: edge.id,
    }));

    // Create force simulation
    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        'link',
        d3
          .forceLink(simLinks)
          .id((d: any) => d.id)
          .distance(fullConfig.linkDistance)
          .strength(fullConfig.linkStrength)
      )
      .force('charge', d3.forceManyBody().strength(fullConfig.repulsion))
      .force('collision', rectangleCollide(fullConfig.collisionPadding))
      .force(
        'center',
        d3
          .forceCenter(canvasDimensions.width / 2, canvasDimensions.height / 2)
          .strength(fullConfig.centerStrength)
      )
      .alphaDecay(fullConfig.alphaDecay)
      .velocityDecay(fullConfig.velocityDecay);

    // Update React Flow nodes on each simulation tick
    simulation.on('tick', () => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const simNode = simNodes.find((n) => n.id === node.id);
          if (!simNode) return node;

          return {
            ...node,
            position: {
              x: simNode.x,
              y: simNode.y,
            },
          };
        })
      );
    });

    // Store simulation reference for cleanup
    simulationRef.current = simulation;

    // Cleanup on unmount or when dependencies change
    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [
    initialNodes.length,
    edges.length,
    canvasDimensions.width,
    canvasDimensions.height,
    fullConfig.repulsion,
    fullConfig.linkDistance,
    fullConfig.linkStrength,
    fullConfig.collisionPadding,
    fullConfig.centerStrength,
  ]);

  // Handle node dragging - restart simulation with dragged node fixed
  const handleNodeDragStart = (nodeId: string) => {
    if (!simulationRef.current) return;

    simulationRef.current.alphaTarget(0.3).restart();

    const simNode = simulationRef.current.nodes().find((n: any) => n.id === nodeId);
    if (simNode) {
      simNode.fx = simNode.x;
      simNode.fy = simNode.y;
    }
  };

  const handleNodeDrag = (nodeId: string, position: { x: number; y: number }) => {
    if (!simulationRef.current) return;

    const simNode = simulationRef.current.nodes().find((n: any) => n.id === nodeId);
    if (simNode) {
      simNode.fx = position.x;
      simNode.fy = position.y;
    }
  };

  const handleNodeDragEnd = (nodeId: string) => {
    if (!simulationRef.current) return;

    simulationRef.current.alphaTarget(0);

    const simNode = simulationRef.current.nodes().find((n: any) => n.id === nodeId);
    if (simNode) {
      simNode.fx = null;
      simNode.fy = null;
    }
  };

  return {
    nodes,
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragEnd,
    simulation: simulationRef.current,
  };
}
