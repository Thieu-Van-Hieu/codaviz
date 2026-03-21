import type { ErrorCode, ErrorTableEntry } from '../types/diagram'

/**
 * Lookup table mapping every error code to a human-readable entry.
 * Used by ErrorPanel to display cause + fix hint,
 * and can be referenced by AI to self-correct generated DSL.
 */
export const ERROR_TABLE: Record<ErrorCode, ErrorTableEntry> = {
  E001: {
    code: 'E001',
    message: 'Missing closing bracket ]',
    cause: 'Node label thiếu dấu đóng ]',
    fix: 'A[Label → đổi thành A[Label]',
  },
  E002: {
    code: 'E002',
    message: 'Unknown node reference',
    cause: 'Edge trỏ tới node chưa được khai báo',
    fix: 'Khai báo X[Label] trước khi dùng X trong edge',
  },
  E003: {
    code: 'E003',
    message: 'Missing @enduml',
    cause: 'PlantUML block chưa đóng',
    fix: 'Thêm @enduml vào dòng cuối file',
  },
  E004: {
    code: 'E004',
    message: 'Invalid graph direction',
    cause: 'Direction không hợp lệ sau "graph"',
    fix: 'Dùng một trong: graph TD | LR | BT | RL',
  },
  E005: {
    code: 'E005',
    message: 'Duplicate node ID',
    cause: 'Hai node có cùng ID trong cùng diagram',
    fix: 'Mỗi node cần ID unique, đổi tên một trong hai',
  },
  E006: {
    code: 'E006',
    message: 'Invalid YAML indentation',
    cause: 'Sai indent trong metadata block (dùng tab hoặc số lẻ spaces)',
    fix: 'Dùng đúng 2 spaces mỗi cấp, không dùng tab',
  },
  E007: {
    code: 'E007',
    message: 'Missing graph declaration',
    cause: 'DSL không có dòng "graph TD/LR/BT/RL" ở đầu',
    fix: 'Thêm "graph TD" vào dòng đầu tiên của DSL',
  },
  E099: {
    code: 'E099',
    message: 'Unknown parse error',
    cause: 'Lỗi không xác định trong quá trình parse',
    fix: 'Kiểm tra lại toàn bộ cú pháp DSL',
  },
}
