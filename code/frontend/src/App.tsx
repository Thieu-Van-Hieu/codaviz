import { useCallback, useEffect, useRef, useState } from 'react'
import { useDiagramStore } from './store/diagramStore'
import { parseDocumentFrontmatter } from './core/parser'
import { parseFlowchart } from './plugins/flowchart/parser'
import type { DiagramDocument } from './types/diagram'
import { Editor } from './features/editor'
import { Canvas } from './features/canvas'
import { ErrorPanel } from './components/ErrorPanel'
import { Toolbar } from './components/Toolbar'
import { ResizableDivider } from './components/ui/ResizableDivider'

/** Default width of the left editor panel in px */
const EDITOR_DEFAULT_WIDTH = 360

// ─── PanelHeader ─────────────────────────────────────────────────────────────

interface PanelHeaderProps {
  /** Colour of the status dot */
  dot: string
  /** Panel label text (uppercased via CSS) */
  label: string
  /** Optional right-aligned hint text */
  right?: string
}

/**
 * Thin header strip shown at the top of each panel.
 * Displays a coloured dot, a label, and an optional right-side note.
 */
const PanelHeader = ({ dot, label, right }: PanelHeaderProps) => (
  <div style={{
    height: 32,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 14px',
    background: '#f1efe8',
    borderBottom: '0.5px solid #d3d1c7',
    fontSize: 11,
    fontWeight: 500,
    color: '#888780',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    flexShrink: 0,
  }}>
    <span style={{ fontSize: 8, color: dot }}>●</span>
    <span>{label}</span>
    {right && (
      <span style={{
        marginLeft: 'auto',
        fontSize: 10,
        color: '#b4b2a9',
        textTransform: 'none',
        fontWeight: 400,
        letterSpacing: 0,
      }}>
        {right}
      </span>
    )}
  </div>
)

// ─── App ─────────────────────────────────────────────────────────────────────

/**
 * Root application component.
 *
 * Responsibilities:
 * - Run the parse pipeline (debounced 300 ms) whenever `source` changes
 * - Lay out the three-panel shell: Toolbar → [Editor | Canvas]
 * - Wire the ResizableDivider so the editor panel can be dragged wider/narrower
 */
export const App = () => {
  const source    = useDiagramStore(s => s.source)
  const setDoc    = useDiagramStore(s => s.setDoc)
  const isSyncing = useDiagramStore(s => s.isSyncing)

  const [editorWidth, setEditorWidth] = useState(EDITOR_DEFAULT_WIDTH)
  const editorPanelRef = useRef<HTMLDivElement>(null)
  const parseTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Parse pipeline (debounced 300 ms) ──────────────────────────────────
  useEffect(() => {
    // Skip re-parse when the store is writing back after a node drag
    if (isSyncing) return

    if (parseTimer.current) clearTimeout(parseTimer.current)

    parseTimer.current = setTimeout(() => {
      // Step 1: split frontmatter YAML from DSL text
      const { dsl, layoutData, errors: yamlErrors } = parseDocumentFrontmatter(source)

      // Step 2: parse the DSL (flowchart for now, registry in P2)
      const { logic, errors: dslErrors } = parseFlowchart(dsl)

      const doc: DiagramDocument = { layoutData, diagramLogic: logic, rawDsl: dsl }
      setDoc(doc, [...yamlErrors, ...dslErrors])
    }, 300)

    return () => { if (parseTimer.current) clearTimeout(parseTimer.current) }
  }, [source, isSyncing, setDoc])

  /** Called by ResizableDivider on every mouse-move while dragging */
  const handleEditorResize = useCallback((width: number) => {
    setEditorWidth(width)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: '#f7f6f2',
    }}>
      {/* ── Top toolbar ── */}
      <Toolbar />

      {/* ── Main panel row ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Code Editor */}
        <div
          ref={editorPanelRef}
          style={{
            width: editorWidth,
            minWidth: 180,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: '#fafaf8',
          }}
        >
          <PanelHeader
            dot="#EF9F27"
            label="source.diagram"
            right="Mermaid · PlantUML"
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor />
          </div>
          <ErrorPanel />
        </div>

        {/* Drag handle between editor and canvas */}
        <ResizableDivider
          panelRef={editorPanelRef}
          onResize={handleEditorResize}
          minWidth={180}
          maxWidth={720}
        />

        {/* Right: Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PanelHeader
            dot="#378ADD"
            label="canvas"
            right="kéo node để cập nhật metadata"
          />
          <div style={{ flex: 1 }}>
            <Canvas />
          </div>
        </div>

      </div>
    </div>
  )
}
