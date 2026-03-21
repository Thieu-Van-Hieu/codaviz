import { useCallback, useEffect, useRef } from 'react'

interface Props {
  /** Callback fired continuously while dragging with new width in px */
  onResize: (width: number) => void
  /** The panel element whose width is being controlled */
  panelRef: React.RefObject<HTMLDivElement>
  /** Min width in px (default 180) */
  minWidth?: number
  /** Max width in px (default 720) */
  maxWidth?: number
}

/**
 * Vertical drag handle that lets the user resize the left panel.
 * Attaches mousemove/mouseup listeners on the document so dragging
 * outside the element still works smoothly.
 */
export const ResizableDivider = ({
  onResize,
  panelRef,
  minWidth = 180,
  maxWidth = 720,
}: Props) => {
  const dragging = useRef(false)
  const startX   = useRef(0)
  const startW   = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = panelRef.current?.offsetWidth ?? 360
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [panelRef])

  useEffect(() => {
    /** Handle mouse move — calculate new width and clamp to [min, max] */
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta    = e.clientX - startX.current
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startW.current + delta))
      onResize(newWidth)
    }

    /** Stop dragging on mouse up */
    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
  }, [onResize, minWidth, maxWidth])

  return (
    <div
      onMouseDown={onMouseDown}
      title="Kéo để thay đổi kích thước"
      style={{
        width: 5,
        flexShrink: 0,
        cursor: 'col-resize',
        background: 'transparent',
        borderRight: '0.5px solid #d3d1c7',
        transition: 'background 0.15s',
        zIndex: 10,
        position: 'relative',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#AFA9EC')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    />
  )
}
