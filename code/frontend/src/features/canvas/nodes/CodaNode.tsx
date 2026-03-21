import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

/** Data shape attached to every CodaViz node in React Flow */
export interface CodaNodeData {
  label:  string
  color?: string
  nodeId: string
  width:  number
  height: number
}

/**
 * Custom React Flow node for CodaViz.
 *
 * Renders a rounded rectangle with:
 * - A coloured left border accent matching the node's `color` metadata
 * - A small ID badge in the top-left corner
 * - Four connection handles (top/bottom/left/right)
 * - Selected-state ring using the accent colour
 */
export const CodaNode = memo(({ data, selected }: NodeProps<CodaNodeData>) => {
  const accent = data.color ?? '#7F77DD'

  return (
    <div style={{
      width:   data.width,
      height:  data.height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: '#fff',
      border: selected
        ? `1.5px solid ${accent}`
        : '0.5px solid #d3d1c7',
      borderLeft: `3px solid ${accent}`,
      borderRadius: 8,
      boxShadow: selected
        ? `0 0 0 3px ${accent}22`
        : '0 1px 4px rgba(0,0,0,0.07)',
      cursor: 'grab',
      userSelect: 'none',
      transition: 'border-color 0.12s, box-shadow 0.12s',
    }}>
      {/* Short ID badge — top-left corner */}
      <div style={{
        position: 'absolute',
        top: -8, left: -8,
        width: 18, height: 18,
        borderRadius: '50%',
        background: accent + '18',
        border: `1.5px solid ${accent}55`,
        color: accent,
        fontSize: 9,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        zIndex: 10,
      }}>
        {data.nodeId.slice(0, 2)}
      </div>

      {/* Node label */}
      <span style={{
        fontSize: 12.5,
        fontWeight: 500,
        color: '#1a1a18',
        textAlign: 'center',
        padding: '0 16px',
        lineHeight: 1.3,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {data.label}
      </span>

      {/* Connection handles on all four sides */}
      {([
        [Position.Top,    'target'],
        [Position.Bottom, 'source'],
        [Position.Left,   'target'],
        [Position.Right,  'source'],
      ] as const).map(([pos, type]) => (
        <Handle
          key={pos}
          type={type}
          position={pos}
          style={{ background: accent, width: 8, height: 8, border: '2px solid #fff' }}
        />
      ))}
    </div>
  )
})

CodaNode.displayName = 'CodaNode'
