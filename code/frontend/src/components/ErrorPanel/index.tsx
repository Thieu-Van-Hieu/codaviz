import { useState } from 'react'
import { useDiagramStore } from '../../store/diagramStore'
import { ERROR_TABLE } from '../../core/errorTable'
import type { ParseError } from '../../types/diagram'

interface ErrorRowProps {
  error: ParseError
}

/**
 * Single error row inside the ErrorPanel.
 * Shows the error code badge, line number, message, and a toggle
 * to reveal the cause + fix hint from ERROR_TABLE.
 */
const ErrorRow = ({ error }: ErrorRowProps) => {
  const [showFix, setShowFix] = useState(false)
  const entry = ERROR_TABLE[error.code]

  return (
    <div style={{
      padding: '6px 14px',
      borderBottom: '0.5px solid #f1efe8',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Error code badge */}
        <span style={{
          fontFamily: 'monospace',
          fontSize: 11, fontWeight: 700,
          color: '#E24B4A', background: '#FCEBEB',
          padding: '1px 6px', borderRadius: 4, flexShrink: 0,
        }}>
          {error.code}
        </span>

        {error.line && (
          <span style={{ fontSize: 11, color: '#b4b2a9', flexShrink: 0 }}>
            L{error.line}
          </span>
        )}

        <span style={{ fontSize: 12, color: '#2c2c2a', flex: 1 }}>
          {error.message}
          {error.token && (
            <code style={{
              marginLeft: 6, fontSize: 11,
              background: '#f1efe8', padding: '1px 5px',
              borderRadius: 3, color: '#5f5e5a',
            }}>
              {error.token}
            </code>
          )}
        </span>

        <button
          onClick={() => setShowFix(v => !v)}
          style={{
            fontSize: 11, color: '#1D9E75',
            background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 6px',
            borderRadius: 4, flexShrink: 0,
          }}
        >
          {showFix ? 'Ẩn' : 'Cách sửa ↓'}
        </button>
      </div>

      {showFix && entry && (
        <div style={{
          marginLeft: 80, fontSize: 11,
          color: '#3B6D11', background: '#EAF3DE',
          padding: '4px 8px', borderRadius: 4, lineHeight: 1.6,
        }}>
          <strong>Nguyên nhân:</strong> {entry.cause}<br />
          <strong>Cách sửa:</strong> {entry.fix}
        </div>
      )}
    </div>
  )
}

/**
 * Collapsible panel shown below the code editor.
 * - Displays a green "no errors" bar when the diagram is valid
 * - Displays a red header + scrollable list when there are parse errors
 * - Each row links to the ERROR_TABLE entry for quick lookup
 */
export const ErrorPanel = () => {
  const errors = useDiagramStore(s => s.errors)
  const [collapsed, setCollapsed] = useState(false)

  if (errors.length === 0) {
    return (
      <div style={{
        height: 28, display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 14px', borderTop: '0.5px solid #d3d1c7',
        background: '#f1efe8', fontSize: 11, color: '#1D9E75',
      }}>
        <span style={{ fontSize: 10 }}>●</span>
        <span>Không có lỗi</span>
      </div>
    )
  }

  return (
    <div style={{
      borderTop: '0.5px solid #d3d1c7',
      background: '#fafaf8',
      maxHeight: collapsed ? 28 : 200,
      overflow: 'hidden',
      transition: 'max-height 0.2s',
      flexShrink: 0,
    }}>
      {/* Clickable header to collapse/expand */}
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          height: 28, display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 14px', background: '#f1efe8',
          borderBottom: collapsed ? 'none' : '0.5px solid #d3d1c7',
          cursor: 'pointer', userSelect: 'none',
          fontSize: 11, fontWeight: 500, color: '#E24B4A',
        }}
      >
        <span style={{ fontSize: 10 }}>●</span>
        <span>{errors.length} lỗi</span>
        <span style={{ marginLeft: 'auto', color: '#888780', fontSize: 10 }}>
          {collapsed ? '▲' : '▼'}
        </span>
      </div>

      {!collapsed && (
        <div style={{ overflowY: 'auto', maxHeight: 172 }}>
          {errors.map((e, i) => <ErrorRow key={i} error={e} />)}
        </div>
      )}
    </div>
  )
}
