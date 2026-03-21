import type { DiagramLogic, DiagramEdge, Direction, ParseError } from '../../../types/diagram'

// ─── Regex patterns ───────────────────────────────────────────────────────────

const RE_GRAPH_HEADER = /^graph\s+(TD|LR|BT|RL)\s*$/i
const RE_NODE_LABEL   = /^([A-Za-z0-9_]+)\[([^\]]*)\]\s*$/
// Edge: A[Label] -->|edgeLabel| B[Label]  or  A --> B
const RE_EDGE = /^([A-Za-z0-9_]+)(?:\[([^\]]*)\])?\s*(-->|---|-\.->|--o|--x)(?:\|([^|]*)\|)?\s*([A-Za-z0-9_]+)(?:\[([^\]]*)\])?/
// Unclosed bracket detection
const RE_UNCLOSED = /\[[^\]]+$/

// ─── Edge style from arrow token ─────────────────────────────────────────────

function edgeStyle(arrow: string): DiagramEdge['style'] {
  if (arrow === '-.->' || arrow === '-.->') return 'dashed'
  if (arrow === '---')  return 'solid'
  return 'solid'
}

// ─── Main parser ─────────────────────────────────────────────────────────────

/**
 * Parse a Mermaid-like flowchart DSL string into a `DiagramLogic` object.
 *
 * Supported syntax:
 * - `graph TD | LR | BT | RL` — direction header
 * - `A[Label]` — standalone node declaration
 * - `A --> B`, `A[Label] --> B[Label]` — edges
 * - `A -->|edge label| B` — labelled edges
 * - `A -.-> B` — dashed edge
 * - `%% comment` — line comments
 *
 * @param dsl - Raw DSL text (without frontmatter)
 * @returns Parsed logic and any parse errors with line numbers
 */
export function parseFlowchart(dsl: string): { logic: DiagramLogic; errors: ParseError[] } {
  const errors: ParseError[] = []
  const logic: DiagramLogic = {
    direction: 'TD',
    nodes: {},
    edges: [],
  }

  const lines = dsl.split('\n')
  let hasHeader = false
  const declaredNodes = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()
    const lineNum = i + 1

    if (!line || line.startsWith('%%')) continue

    // ── Graph header ──────────────────────────────────────────────────────────
    const headerMatch = line.match(RE_GRAPH_HEADER)
    if (headerMatch) {
      hasHeader = true
      logic.direction = headerMatch[1].toUpperCase() as Direction
      continue
    }

    // ── Unclosed bracket check ────────────────────────────────────────────────
    if (RE_UNCLOSED.test(line)) {
      errors.push({ code: 'E001', message: 'Missing closing bracket ]', line: lineNum, token: line })
      continue
    }

    // ── Edge ──────────────────────────────────────────────────────────────────
    const edgeMatch = line.match(RE_EDGE)
    if (edgeMatch) {
      const [, fromId, fromLabel, arrow, edgeLabel, toId, toLabel] = edgeMatch

      if (fromLabel) { logic.nodes[fromId] = fromLabel; declaredNodes.add(fromId) }
      if (toLabel)   { logic.nodes[toId]   = toLabel;   declaredNodes.add(toId) }

      // Register IDs even without labels so edge refs work
      if (!logic.nodes[fromId]) logic.nodes[fromId] = fromId
      if (!logic.nodes[toId])   logic.nodes[toId]   = toId
      declaredNodes.add(fromId)
      declaredNodes.add(toId)

      const edge: DiagramEdge = {
        from: fromId,
        to: toId,
        style: edgeStyle(arrow),
      }
      if (edgeLabel?.trim()) edge.label = edgeLabel.trim()
      logic.edges.push(edge)
      continue
    }

    // ── Standalone node ───────────────────────────────────────────────────────
    const nodeMatch = line.match(RE_NODE_LABEL)
    if (nodeMatch) {
      const [, id, label] = nodeMatch
      if (logic.nodes[id] && logic.nodes[id] !== id) {
        errors.push({ code: 'E005', message: `Duplicate node ID: ${id}`, line: lineNum, token: id })
      } else {
        logic.nodes[id] = label
        declaredNodes.add(id)
      }
    }
  }

  // ── Post-parse validation ─────────────────────────────────────────────────
  if (!hasHeader) {
    errors.push({ code: 'E007', message: 'Missing graph declaration', line: 1 })
  }

  return { logic, errors }
}

// ─── Serialiser ───────────────────────────────────────────────────────────────

/**
 * Serialise a `DiagramLogic` object back into Mermaid flowchart DSL text.
 *
 * Edges are emitted first (with inline node labels).
 * Standalone nodes (not referenced by any edge) are emitted afterwards.
 *
 * @param logic     - The diagram logic to serialise
 * @param direction - Graph direction, defaults to 'TD'
 * @returns Mermaid DSL string
 */
export function serialiseFlowchart(logic: DiagramLogic, direction: Direction = 'TD'): string {
  const lines: string[] = [`graph ${direction}`]

  // Edges (nodes declared inline)
  const edgeNodeIds = new Set(logic.edges.flatMap(e => [e.from, e.to]))

  for (const edge of logic.edges) {
    const from = edgeNodeIds.has(edge.from) && logic.nodes[edge.from] !== edge.from
      ? `${edge.from}[${logic.nodes[edge.from]}]`
      : edge.from
    const to = edgeNodeIds.has(edge.to) && logic.nodes[edge.to] !== edge.to
      ? `${edge.to}[${logic.nodes[edge.to]}]`
      : edge.to

    const arrow = edge.style === 'dashed' ? '-.->' : '-->'
    const label = edge.label ? `|${edge.label}|` : ''
    lines.push(`    ${from} ${arrow}${label} ${to}`)
  }

  // Standalone nodes (not part of any edge)
  for (const [id, label] of Object.entries(logic.nodes)) {
    if (!edgeNodeIds.has(id) && label !== id) {
      lines.push(`    ${id}[${label}]`)
    }
  }

  return lines.join('\n')
}
