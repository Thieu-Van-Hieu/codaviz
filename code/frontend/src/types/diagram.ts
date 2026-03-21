// ─── Metadata (từ YAML frontmatter) ──────────────────────────────────────────

export interface NodeMeta {
  x: number
  y: number
  color?: string
  width?: number
  height?: number
}

export interface LayoutData {
  nodes: Record<string, NodeMeta>
  settings: {
    theme?: 'light' | 'dark'
    direction?: Direction
    diagramType?: string
    [key: string]: string | undefined
  }
}

// ─── DSL Logic (từ parser) ───────────────────────────────────────────────────

export type Direction = 'TD' | 'LR' | 'BT' | 'RL'

export interface DiagramEdge {
  from: string
  to: string
  label?: string
  style?: 'solid' | 'dashed' | 'dotted'
  arrowType?: 'arrow' | 'none'
}

export interface DiagramLogic {
  direction: Direction
  /** id → label hiển thị */
  nodes: Record<string, string>
  edges: DiagramEdge[]
}

// ─── Document (source of truth) ──────────────────────────────────────────────

export interface DiagramDocument {
  layoutData: LayoutData
  diagramLogic: DiagramLogic
  rawDsl: string
}

// ─── Error system ─────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'E001' | 'E002' | 'E003' | 'E004'
  | 'E005' | 'E006' | 'E007' | 'E099'

export interface ParseError {
  code: ErrorCode
  message: string
  line?: number
  column?: number
  /** Token cụ thể gây lỗi (để highlight trong editor) */
  token?: string
}

export interface ErrorTableEntry {
  code: ErrorCode
  message: string
  cause: string
  fix: string
}

// ─── Plugin interface ─────────────────────────────────────────────────────────

export type RendererType = 'reactflow' | 'reactflow-locked' | 'reactflow-container' | 'svg'
export type DragBehaviour = 'free' | 'y-locked' | 'container' | 'none'
export type LayoutEngine = 'dagre' | 'elk' | 'elk-radial' | 'timeline' | 'none'
export type DSLSource = 'mermaid' | 'plantuml' | 'codaviz'

export interface RendererProps {
  document: DiagramDocument
  onNodePositionChange: (id: string, x: number, y: number) => void
}

export interface DiagramPlugin {
  id: string
  name: string
  source: DSLSource
  renderer: RendererType
  dragBehaviour: DragBehaviour
  layoutEngine: LayoutEngine

  detect(dsl: string): boolean
  parse(dsl: string): { logic: DiagramLogic; errors: ParseError[] }
  serialise(logic: DiagramLogic, direction?: Direction): string

  Renderer: React.ComponentType<RendererProps>
}
