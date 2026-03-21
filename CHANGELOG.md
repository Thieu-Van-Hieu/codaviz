
---

## [0.1.0-alpha] — 2026-03-22

Phiên bản MVP đầu tiên. P1 hoàn chỉnh.

### Added

- **Flowchart parser** — Mermaid `graph TD / LR / BT / RL` với node labels, edges, edge labels, dashed edges (`-.->`)
- **Monaco Editor** — syntax highlighting Mermaid-like, inline error markers (gạch đỏ dưới token lỗi)
- **Error Panel** — danh sách lỗi parse với error code, nguyên nhân và cách sửa (E001–E007)
- **React Flow canvas** — custom node với accent color và ID badge, handles kết nối
- **Drag & Drop node** — kéo node → cập nhật metadata → serialise ngược về source text (two-way binding)
- **Auto-layout Dagre** — node mới chưa có tọa độ được tự động xếp vị trí
- **Adaptive Snap Grid** — grid size thay đổi theo zoom: 64 / 32 / 16 / 8px
- **Resizable editor panel** — kéo thanh divider để thay đổi chiều rộng (180–720px)
- **Zoom font editor** — nút A− / A+ / ↺ và phím tắt Ctrl+− / Ctrl+= / Ctrl+0 (6–24px)
- **AI prompt template** — nút copy instructions để paste vào ChatGPT / Claude
- **Source format** — file văn bản duy nhất gồm YAML frontmatter (metadata) + DSL (Mermaid)

### Architecture

- Plugin-based diagram registry (chuẩn bị cho Sequence, Class, ER ở P2)
- `export const` convention toàn bộ codebase
- JSDoc tiếng Việt cho tất cả hàm và component
- Zustand store với `rfNodes` / `rfEdges` mirror cho export

---

## Upcoming

### [0.2.0-alpha] — P2

- Export PNG @2x, SVG, Copy to clipboard
- Undo / Redo
- Sequence Diagram (PlantUML + Y-locked lifeline)
- Class / ER Diagram + SQL export
- Node shapes mở rộng (circle, diamond, cylinder...)
