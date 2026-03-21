import type { DiagramDocument, LayoutData, NodeMeta, ParseError } from '../../types/diagram'

// ─── Frontmatter splitter ─────────────────────────────────────────────────────

function splitFrontmatter(text: string): { yaml: string; dsl: string } | null {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return null
  return { yaml: match[1], dsl: match[2].trim() }
}

// ─── Minimal YAML parser (chỉ parse đúng format spec) ────────────────────────

function parseNodeProps(propsStr: string): NodeMeta {
  const props: Record<string, string | number> = {}
  const re = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|([^,}\s]+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(propsStr)) !== null) {
    const key = m[1]
    const val = (m[2] ?? m[3] ?? m[4] ?? '').trim()
    props[key] = isNaN(Number(val)) ? val : Number(val)
  }
  const p = props as Record<string, unknown>
  return {
    x:      typeof p.x      === 'number' ? p.x      as number : 100,
    y:      typeof p.y      === 'number' ? p.y      as number : 100,
    color:  typeof p.color  === 'string' ? p.color  as string : undefined,
    width:  typeof p.width  === 'number' ? p.width  as number : undefined,
    height: typeof p.height === 'number' ? p.height as number : undefined,
  }
}

function parseYaml(yaml: string): { data: LayoutData; errors: ParseError[] } {
  const errors: ParseError[] = []
  const data: LayoutData = { nodes: {}, settings: {} }

  const lines = yaml.split('\n')
  let section: 'none' | 'nodes' | 'settings' = 'none'

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed || trimmed === 'metadata:') continue

    const indent = raw.match(/^(\s*)/)?.[1].length ?? 0

    // Detect tab usage
    if (raw.includes('\t')) {
      errors.push({ code: 'E006', message: 'Invalid YAML indentation', line: i + 1 })
      continue
    }

    if (indent === 2) {
      if (trimmed === 'nodes:')    { section = 'nodes';    continue }
      if (trimmed === 'settings:') { section = 'settings'; continue }
    }

    if (indent === 4) {
      if (section === 'nodes') {
        const m = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*\{(.+)\}/)
        if (m) data.nodes[m[1]] = parseNodeProps(m[2])
      } else if (section === 'settings') {
        const m = trimmed.match(/^(\w+)\s*:\s*(.+)/)
        if (m) data.settings[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
      }
    }
  }

  return { data, errors }
}

// ─── Serialiser ───────────────────────────────────────────────────────────────

/**
 * Serialise a DiagramDocument back into the `.codaviz` source text format.
 *
 * Produces:
 * ```
 * ---
 * metadata:
 *   nodes:
 *     A: { x: 100, y: 150, color: '#7F77DD' }
 *   settings:
 *     direction: TD
 * ---
 * graph TD
 *     A[Label] --> B[Label]
 * ```
 *
 * @param doc - The document to serialise
 * @returns Full source string ready to be written back to the editor
 */
export function serialiseDocument(doc: DiagramDocument): string {
  const { layoutData, rawDsl } = doc

  const nodeLines = Object.entries(layoutData.nodes)
    .map(([id, meta]) => {
      const parts: string[] = [
        `x: ${Math.round(meta.x)}`,
        `y: ${Math.round(meta.y)}`,
      ]
      if (meta.color)  parts.push(`color: '${meta.color}'`)
      if (meta.width)  parts.push(`width: ${meta.width}`)
      if (meta.height) parts.push(`height: ${meta.height}`)
      return `    ${id}: { ${parts.join(', ')} }`
    })
    .join('\n')

  const settingLines = Object.entries(layoutData.settings)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `    ${k}: ${v}`)
    .join('\n')

  const metaBlock = [
    '---',
    'metadata:',
    '  nodes:',
    nodeLines || '    {}',
    '  settings:',
    settingLines || '    {}',
    '---',
  ].join('\n')

  return `${metaBlock}\n${rawDsl}`
}

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Split a `.codaviz` source string into its YAML frontmatter and DSL sections,
 * then parse the YAML into a `LayoutData` object.
 *
 * If no `---` frontmatter is found the entire text is treated as DSL
 * and `layoutData` is initialised with empty nodes/settings.
 *
 * @param text - Raw source text from the editor
 * @returns Parsed layout data, the raw DSL string, and any YAML parse errors
 */
export function parseDocumentFrontmatter(text: string): {
  yaml: string
  dsl: string
  layoutData: LayoutData
  errors: ParseError[]
} {
  const split = splitFrontmatter(text)

  if (!split) {
    // No frontmatter → treat whole text as DSL
    return {
      yaml: '',
      dsl: text.trim(),
      layoutData: { nodes: {}, settings: {} },
      errors: [],
    }
  }

  const { data: layoutData, errors } = parseYaml(split.yaml)
  return { yaml: split.yaml, dsl: split.dsl, layoutData, errors }
}
