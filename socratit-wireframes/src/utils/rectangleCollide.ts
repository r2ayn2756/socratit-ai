/**
 * Custom d3-force collision force for rectangular nodes
 *
 * d3-force's built-in forceCollide assumes circular nodes.
 * This implementation handles rectangular collision detection
 * to prevent nodes from overlapping in the Atlas knowledge graph.
 *
 * Based on: https://observablehq.com/@cmrivers/rectangle-collision-force
 */

interface RectangleNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  width?: number;
  height?: number;
}

/**
 * Creates a rectangle collision force that prevents nodes from overlapping
 *
 * @param padding - Additional spacing around nodes (default: 10)
 * @returns A d3-force compatible force function
 */
export function rectangleCollide(padding = 10) {
  let nodes: RectangleNode[] = [];
  let strength = 1;
  let iterations = 1;

  function force(alpha: number) {
    const quad = d3Quadtree();

    for (let i = 0; i < iterations; ++i) {
      for (const node of nodes) {
        const nodeWidth = (node.width || 12) + padding;
        const nodeHeight = (node.height || 12) + padding;

        // Check collision with all other nodes
        for (const otherNode of nodes) {
          if (node === otherNode) continue;

          const otherWidth = (otherNode.width || 12) + padding;
          const otherHeight = (otherNode.height || 12) + padding;

          // Calculate distance between node centers
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;

          // Calculate minimum non-overlapping distance
          const minDistX = (nodeWidth + otherWidth) / 2;
          const minDistY = (nodeHeight + otherHeight) / 2;

          // Check for overlap (AABB collision detection)
          if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
            // Calculate overlap amounts
            const overlapX = minDistX - Math.abs(dx);
            const overlapY = minDistY - Math.abs(dy);

            // Resolve collision in the direction of least overlap
            if (overlapX < overlapY) {
              // Horizontal separation
              const direction = dx > 0 ? 1 : -1;
              const force = (overlapX / 2) * strength * alpha;
              node.vx = (node.vx || 0) - direction * force;
              otherNode.vx = (otherNode.vx || 0) + direction * force;
            } else {
              // Vertical separation
              const direction = dy > 0 ? 1 : -1;
              const force = (overlapY / 2) * strength * alpha;
              node.vy = (node.vy || 0) - direction * force;
              otherNode.vy = (otherNode.vy || 0) + direction * force;
            }
          }
        }
      }
    }
  }

  force.initialize = function(_nodes: RectangleNode[]) {
    nodes = _nodes;
  };

  force.strength = function(_strength?: number) {
    if (_strength === undefined) return strength;
    strength = _strength;
    return force;
  };

  force.iterations = function(_iterations?: number) {
    if (_iterations === undefined) return iterations;
    iterations = _iterations;
    return force;
  };

  return force;
}

// Simplified quadtree stub (not used in current implementation but keeps API consistent)
function d3Quadtree() {
  return {
    visit: () => {},
    add: () => {},
  };
}
