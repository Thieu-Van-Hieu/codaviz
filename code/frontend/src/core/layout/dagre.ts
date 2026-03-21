import dagre from 'dagre'
import type { DiagramDocument } from '../../types/diagram'

const NODE_W = 140
const NODE_H = 44

/**
 * Run Dagre layout on every node in the document and return
 * a map of `{ id → { x, y } }` using top-left corner coordinates.
 *
 * @param doc - The full DiagramDocument (uses diagramLogic + layoutData for sizes)
 * @returns Positions for every node id present in diagramLogic.nodes
 */
export function runDagreLayout(
  doc: DiagramDocument,
): Record<string, { x: number; y: number }> {
  const { diagramLogic } = doc

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir:  diagramLogic.direction,
    nodesep:  64,
    ranksep:  80,
    marginx:  48,
    marginy:  48,
  })

  for (const id of Object.keys(diagramLogic.nodes)) {
    const meta = doc.layoutData.nodes[id]
    g.setNode(id, {
      width:  meta?.width  ?? NODE_W,
      height: meta?.height ?? NODE_H,
    })
  }

  for (const edge of diagramLogic.edges) {
    g.setEdge(edge.from, edge.to)
  }

  dagre.layout(g)

  const result: Record<string, { x: number; y: number }> = {}
  for (const id of Object.keys(diagramLogic.nodes)) {
    const n = g.node(id)
    if (n) {
      result[id] = {
        x: Math.round(n.x - (doc.layoutData.nodes[id]?.width  ?? NODE_W) / 2),
        y: Math.round(n.y - (doc.layoutData.nodes[id]?.height ?? NODE_H) / 2),
      }
    }
  }
  return result
}

/**
 * Merge persisted metadata positions with Dagre auto-layout.
 *
 * - Nodes that already have `x, y` in `layoutData` keep their position.
 * - New nodes (no metadata entry) get positions from Dagre.
 *
 * @param doc - Current DiagramDocument
 * @returns Final positions for all nodes
 */
export function mergeLayout(
  doc: DiagramDocument,
): Record<string, { x: number; y: number }> {
  const allIds = Object.keys(doc.diagramLogic.nodes)
  const needsLayout = allIds.filter(id => !doc.layoutData.nodes[id])

  if (needsLayout.length === 0) {
    // All nodes already have positions
    return Object.fromEntries(
      allIds.map(id => [id, { x: doc.layoutData.nodes[id].x, y: doc.layoutData.nodes[id].y }])
    )
  }

  // Run dagre for all, then override with known positions
  const dagrePositions = runDagreLayout(doc)
  const result: Record<string, { x: number; y: number }> = {}

  for (const id of allIds) {
    const meta = doc.layoutData.nodes[id]
    result[id] = meta
      ? { x: meta.x, y: meta.y }
      : (dagrePositions[id] ?? { x: 0, y: 0 })
  }

  return result
}
