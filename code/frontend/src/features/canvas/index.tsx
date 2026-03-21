import { useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeDragHandler,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useDiagramStore } from '../../store/diagramStore'
import { mergeLayout } from '../../core/layout/dagre'
import { CodaNode, type CodaNodeData } from './nodes/CodaNode'

const NODE_W = 140
const NODE_H = 44

const nodeTypes = { codaNode: CodaNode }

/**
 * Returns the snap-grid size that feels natural at the given zoom level.
 *
 * | Zoom        | Grid |
 * |-------------|------|
 * | < 50 %      | 64px |
 * | 50 – 100 %  | 32px |
 * | 100 – 150 % | 16px |
 * | > 150 %     | 8px  |
 */
const gridSizeFromZoom = (zoom: number): number => {
  if (zoom < 0.5) return 64
  if (zoom < 1.0) return 32
  if (zoom < 1.5) return 16
  return 8
}

/**
 * Converts a DiagramDocument into React Flow nodes and edges.
 * Positions come from `mergeLayout` (stored coords first, Dagre fallback).
 */
const buildGraph = (
  doc: ReturnType<typeof useDiagramStore.getState>['doc'],
): { nodes: Node<CodaNodeData>[]; edges: Edge[] } => {
  if (!doc) return { nodes: [], edges: [] }

  const positions = mergeLayout(doc)

  const nodes: Node<CodaNodeData>[] = Object.keys(doc.diagramLogic.nodes).map(id => {
    const meta = doc.layoutData.nodes[id]
    return {
      id,
      type: 'codaNode',
      position: positions[id] ?? { x: 0, y: 0 },
      data: {
        label:  doc.diagramLogic.nodes[id] || id,
        color:  meta?.color,
        nodeId: id,
        width:  meta?.width  ?? NODE_W,
        height: meta?.height ?? NODE_H,
      },
      style: {
        width:      meta?.width  ?? NODE_W,
        height:     meta?.height ?? NODE_H,
        padding:    0,
        background: 'transparent',
        border:     'none',
      },
    }
  })

  const edges: Edge[] = doc.diagramLogic.edges.map((e, i) => ({
    id:     `e-${e.from}-${e.to}-${i}`,
    source: e.from,
    target: e.to,
    label:  e.label,
    type:   'smoothstep',
    style: {
      strokeWidth:    1.5,
      stroke:         '#b4b2a9',
      strokeDasharray: e.style === 'dashed' ? '6 3' : undefined,
    },
    labelStyle:    { fontSize: 11, fill: '#5f5e5a' },
    labelBgStyle:  { fill: '#fafaf8', fillOpacity: 0.9 },
    labelBgPadding: [4, 6] as [number, number],
  }))

  return { nodes, edges }
}

/**
 * React Flow canvas panel.
 *
 * - Syncs nodes/edges from the global DiagramDocument
 * - Fires `onNodeMoved` after each drag to update metadata
 * - Adapts snap-grid size to the current zoom level
 */
export const Canvas = () => {
  const doc       = useDiagramStore(s => s.doc)
  const onMoved   = useDiagramStore(s => s.onNodeMoved)
  const isSyncing = useDiagramStore(s => s.isSyncing)

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([])

  const rfRef       = useRef<ReactFlowInstance | null>(null)
  const isDragging  = useRef(false)
  const gridSizeRef = useRef(32)

  // ── Sync DiagramDocument → RF nodes/edges ─────────────────────────────
  useEffect(() => {
    if (isDragging.current || isSyncing) return
    const { nodes, edges } = buildGraph(doc)
    setRfNodes(nodes)
    setRfEdges(edges)
  }, [doc, isSyncing])

  /** Fit all nodes into view on first render */
  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfRef.current = instance
    setTimeout(() => instance.fitView({ padding: 0.2 }), 80)
  }, [])

  /**
   * Recompute grid size when the user finishes panning/zooming.
   * Triggers a shallow re-render so Background picks up the new gap.
   */
  const onMoveEnd = useCallback((_: unknown, viewport: { zoom: number }) => {
    const newSize = gridSizeFromZoom(viewport.zoom)
    if (newSize !== gridSizeRef.current) {
      gridSizeRef.current = newSize
      setRfNodes(ns => [...ns])
    }
  }, [])

  const onNodeDragStart: NodeDragHandler = useCallback(() => {
    isDragging.current = true
  }, [])

  /** Write new position back to the store → triggers serialise → updates editor */
  const onNodeDragStop: NodeDragHandler = useCallback((_evt, node: Node) => {
    isDragging.current = false
    onMoved(node.id, node.position.x, node.position.y)
  }, [onMoved])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        snapToGrid
        snapGrid={[gridSizeRef.current, gridSizeRef.current]}
        minZoom={0.15}
        maxZoom={3}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 1.5, stroke: '#b4b2a9' },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={gridSizeRef.current}
          size={1}
          color="#d3d1c7"
        />
        <Controls style={{ boxShadow: 'none', border: '0.5px solid #d3d1c7', borderRadius: 8 }} />
        <MiniMap
          nodeColor={n => (n.data as CodaNodeData)?.color ?? '#7F77DD'}
          style={{ border: '0.5px solid #d3d1c7', borderRadius: 8 }}
          maskColor="rgba(241,239,232,0.7)"
        />
      </ReactFlow>
    </div>
  )
}
