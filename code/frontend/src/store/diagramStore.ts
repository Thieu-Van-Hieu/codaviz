import { create } from 'zustand'
import type { DiagramDocument, ParseError } from '../types/diagram'
import { serialiseDocument } from '../core/parser'

// ─── Default source ───────────────────────────────────────────────────────────

const DEFAULT_SOURCE = [
  '---',
  'metadata:',
  '  nodes:',
  "    Start: { x: 220, y: 40, color: '#7F77DD' }",
  "    Auth: { x: 100, y: 160, color: '#1D9E75' }",
  "    Process: { x: 340, y: 160, color: '#1D9E75' }",
  "    Error: { x: 100, y: 280, color: '#D85A30' }",
  "    Done: { x: 340, y: 280, color: '#7F77DD' }",
  '  settings:',
  '    direction: TD',
  '---',
  'graph TD',
  '    Start[Bắt đầu] --> Auth[Xác thực]',
  '    Start --> Process[Xử lý]',
  '    Auth -->|fail| Error[Lỗi]',
  '    Auth -->|pass| Done[Hoàn thành]',
  '    Process --> Done',
].join('\n')

// ─── State interface ──────────────────────────────────────────────────────────

interface DiagramState {
  source: string
  doc: DiagramDocument | null
  errors: ParseError[]
  /** Đang sync từ drag về editor — skip re-parse */
  isSyncing: boolean

  setSource: (source: string) => void
  setDoc: (doc: DiagramDocument, errors: ParseError[]) => void
  /**
   * Gọi khi một node drag stop.
   * Cập nhật tọa độ vào layoutData và serialise ngược về source text.
   */
  onNodeMoved: (id: string, x: number, y: number) => void
  setIsSyncing: (v: boolean) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Global Zustand store for the diagram editor.
 *
 * Holds the raw source text, the parsed document, parse errors,
 * and a `isSyncing` flag that prevents re-parse loops when the canvas
 * writes drag positions back to the editor.
 */
export const useDiagramStore = create<DiagramState>()((set, get) => ({
  source: DEFAULT_SOURCE,
  doc: null,
  errors: [],
  isSyncing: false,

  setSource: (source) => set({ source }),

  setDoc: (doc, errors) => set({ doc, errors }),

  onNodeMoved: (id, x, y) => {
    const { doc } = get()
    if (!doc) return

    const updatedDoc: DiagramDocument = {
      ...doc,
      layoutData: {
        ...doc.layoutData,
        nodes: {
          ...doc.layoutData.nodes,
          [id]: {
            ...(doc.layoutData.nodes[id] ?? {}),
            x: Math.round(x),
            y: Math.round(y),
          },
        },
      },
    }

    const newSource = serialiseDocument(updatedDoc)
    set({ doc: updatedDoc, source: newSource, isSyncing: true })
    setTimeout(() => set({ isSyncing: false }), 0)
  },

  setIsSyncing: (v) => set({ isSyncing: v }),
}))
