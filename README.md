# CodaViz

> **Code the logic, Drag the beauty.**

Hybrid diagram editor kết hợp Diagram-as-Code và kéo thả WYSIWYG.

![License](https://img.shields.io/badge/license-MIT-7F77DD)
![Version](https://img.shields.io/badge/version-0.1.0--alpha-1D9E75)
![Status](https://img.shields.io/badge/status-pre--release-EF9F27)

---

## Vấn đề

| Tool        | Vấn đề                                             |
| ----------- | -------------------------------------------------- |
| PlantUML    | Code tốt nhưng layout xấu, không chỉnh được vị trí |
| LucidChart  | Drag/drop đẹp nhưng AI không import code được      |
| **CodaViz** | Lấy điểm mạnh của cả hai                           |

---

## Tính năng (v0.1.0-alpha)

- Flowchart parser — Mermaid `graph TD / LR / BT / RL`
- Monaco Editor — syntax highlight, inline error, zoom font
- React Flow canvas — kéo thả node, adaptive snap grid
- Two-way binding — sửa code → canvas update, kéo node → code update
- Auto-layout Dagre cho node mới chưa có tọa độ
- Resizable editor panel

---

## Bắt đầu

```bash
cd code/frontend
npm install
npm run dev
```

Mở http://localhost:5173

---

## Cấu trúc repo

```
codaviz/
├── code/
│   └── frontend/     # React + TypeScript app
├── documents/        # Product spec
├── CHANGELOG.md
└── README.md
```

---

## Roadmap

- [x] P1 — Flowchart MVP
- [ ] P2 — Export PNG/SVG, Undo/Redo, Sequence/Class/ER Diagram
- [ ] P3 — Collaborative real-time (Yjs + WebSocket)
- [ ] v1.0 — Public release

---

## Tech stack

React 18 · TypeScript · React Flow · Monaco Editor · Dagre · Zustand · Vite
