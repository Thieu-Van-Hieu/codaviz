import { useState } from 'react'
import { useDiagramStore } from '../../store/diagramStore'

/**
 * Prompt template users can copy and paste into any AI assistant.
 * The AI should return a valid CodaViz DSL block that parses without errors.
 */
const PROMPT_TEMPLATE = `Bạn là expert vẽ diagram. Hãy tạo một diagram theo yêu cầu và trả về ĐÚNG format bên dưới, không giải thích thêm.

FORMAT (bắt buộc):
---
metadata:
  nodes:
    [ID]: { x: [số], y: [số] }
  settings:
    direction: TD
---
graph TD
    [ID][Label] --> [ID][Label]

RULES:
- ID chỉ dùng chữ và số, không dấu cách
- Node: ID[Label hiển thị]
- Edge thường: A --> B hoặc A -->|label| B
- Edge nét đứt: A -.-> B
- Nếu có lỗi parse, đọc Error Table (E001–E007) và sửa lại

YÊU CẦU:
[Mô tả diagram bạn muốn ở đây]`

/**
 * Top toolbar: brand, slogan, error badge, and AI prompt copy button.
 */
export const Toolbar = () => {
  const errors = useDiagramStore(s => s.errors)
  const [copied, setCopied] = useState(false)

  /** Copy the AI prompt template to clipboard, show brief confirmation */
  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      height: 44,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 14px',
      borderBottom: '0.5px solid #d3d1c7',
      background: '#f1efe8',
      flexShrink: 0,
    }}>
      {/* Brand */}
      <span style={{ fontWeight: 700, fontSize: 15, color: '#7F77DD', letterSpacing: '-0.3px' }}>
        CodaViz
      </span>
      <span style={{ fontSize: 11, color: '#b4b2a9', fontStyle: 'italic' }}>
        Code the logic, Drag the beauty.
      </span>

      <div style={{ flex: 1 }} />

      {/* Error count badge */}
      {errors.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#E24B4A',
          background: '#FCEBEB', padding: '3px 8px',
          borderRadius: 5, border: '0.5px solid #F7C1C1',
        }}>
          {errors.length} lỗi
        </div>
      )}

      {/* AI prompt button */}
      <button
        onClick={copyPrompt}
        title="Copy prompt template để dùng với ChatGPT / Claude"
        style={{
          fontSize: 12, fontWeight: 500,
          color:      copied ? '#1D9E75' : '#7F77DD',
          background: copied ? '#E1F5EE' : '#EEEDFE',
          border:     `0.5px solid ${copied ? '#9FE1CB' : '#AFA9EC'}`,
          borderRadius: 6, padding: '5px 12px',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {copied ? '✓ Đã copy!' : '⚡ Copy AI Prompt'}
      </button>
    </div>
  )
}
