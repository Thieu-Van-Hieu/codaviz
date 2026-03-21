# CodaViz

> **Code the logic, Drag the beauty.**

Hybrid diagram editor: viết code (Mermaid/PlantUML) để tạo cấu trúc, kéo thả để chỉnh layout.

## Chạy ngay

```bash
npm install
npm run dev
```

Mở http://localhost:5173

## Cấu trúc

```
src/
├── core/
│   ├── parser/        # Split frontmatter YAML + DSL
│   ├── layout/        # Dagre auto-layout
│   └── errorTable.ts  # Error codes + hướng dẫn sửa
├── plugins/
│   └── flowchart/     # Mermaid graph TD/LR parser
├── store/
│   └── diagramStore.ts  # Zustand state
├── features/
│   ├── editor/        # Monaco Editor
│   └── canvas/        # React Flow + CodaNode
├── components/
│   ├── ErrorPanel/    # Inline error list
│   └── Toolbar/       # Brand + AI prompt copy
└── types/
    └── diagram.ts     # DiagramDocument, DiagramPlugin...
```

## Source format

```
---
metadata:
  nodes:
    A: { x: 100, y: 150, color: '#7F77DD' }
    B: { x: 300, y: 150 }
  settings:
    direction: TD
---
graph TD
    A[Bắt đầu] --> B[Xử lý]
    B -->|success| C[Hoàn thành]
    B -->|fail| D[Lỗi]
```

## P1 MVP — đã có

- [x] Flowchart parser (Mermaid graph TD/LR/BT/RL)
- [x] Monaco Editor với inline error highlight
- [x] Error Panel + Error Table (E001–E007)
- [x] React Flow canvas với custom node
- [x] Adaptive Snap Grid (8/16/32/64px theo zoom)
- [x] Drag node → update metadata → serialise ngược
- [x] Auto-layout Dagre cho node mới
- [x] AI prompt template (copy button)

## P2 — tiếp theo

- [ ] Sequence diagram (PlantUML, Y-locked lifeline)
- [ ] Class / ER / State diagram
- [ ] Export PNG, SVG, SQL
- [ ] Undo/Redo (Zustand temporal)
- [ ] Multi-select, Orthogonal connector
