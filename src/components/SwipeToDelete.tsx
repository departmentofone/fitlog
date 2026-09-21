import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

interface SwipeToDeleteProps {
  /** Called once, when the swipe gesture passes the delete threshold. */
  onDelete: () => void
  children: ReactNode
  /** Applied to the wrapping element — pass matching rounding (e.g. "rounded-xl") to match the child row. */
  className?: string
}

/** How far (as a fraction of row width) the row must be dragged before release triggers delete. */
const THRESHOLD_RATIO = 0.35
/** Movement (px) required before a gesture commits to horizontal (swipe) vs vertical (scroll). */
const DIRECTION_LOCK_PX = 8

interface GestureState {
  pointerId: number
  startX: number
  startY: number
  width: number
  direction: 'horizontal' | 'vertical' | null
}

/**
 * Wraps row content with swipe-left-to-delete behavior. Dragging left reveals a red "Delete"
 * affordance behind the row; releasing past ~35% of the row's width triggers `onDelete` and the
 * row animates away. Releasing before the threshold snaps back. A plain tap (no horizontal drag)
 * passes through untouched, so any existing tap targets inside `children` keep working.
 */
export function SwipeToDelete({ onDelete, children, className = '' }: SwipeToDeleteProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<GestureState | null>(null)
  const dragXRef = useRef(0)
  const didDragRef = useRef(false)

  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [collapseHeight, setCollapseHeight] = useState<number | null>(null)

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (deleting) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      width: rootRef.current?.getBoundingClientRect().width ?? 0,
      direction: null,
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current
    if (!g || g.pointerId !== e.pointerId) return
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY

    if (g.direction === null) {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return
      if (Math.abs(dy) >= Math.abs(dx)) {
        // Vertical intent — let the page scroll natively, stop tracking this gesture.
        gestureRef.current = null
        return
      }
      g.direction = 'horizontal'
      didDragRef.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }

    if (g.direction !== 'horizontal') return
    const clamped = Math.min(0, Math.max(dx, -g.width))
    dragXRef.current = clamped
    setDragX(clamped)
  }

  const finishGesture = (e: ReactPointerEvent<HTMLDivElement>, commit: boolean) => {
    const g = gestureRef.current
    if (!g || g.pointerId !== e.pointerId) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const wasHorizontal = g.direction === 'horizontal'
    const width = g.width
    const finalX = dragXRef.current
    gestureRef.current = null
    setDragging(false)

    if (wasHorizontal) {
      // Swallow the synthetic click that follows a real drag so it can't hit a tap target underneath.
      window.setTimeout(() => {
        didDragRef.current = false
      }, 0)
    } else {
      didDragRef.current = false
    }

    const passedThreshold = commit && wasHorizontal && width > 0 && Math.abs(finalX) >= width * THRESHOLD_RATIO
    if (!passedThreshold) {
      dragXRef.current = 0
      setDragX(0)
      return
    }

    // Committed: finish the slide off-screen, then collapse the row, then actually delete.
    dragXRef.current = -width
    setDragX(-width)
    setDeleting(true)
    setCollapseHeight(rootRef.current?.getBoundingClientRect().height ?? 0)
    window.setTimeout(() => {
      setCollapsed(true)
      window.setTimeout(onDelete, 180)
    }, 180)
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => finishGesture(e, true)
  const handlePointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => finishGesture(e, false)

  // A drag that just happened produces a ghost click on release — swallow only that one.
  const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (didDragRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        maxHeight: collapsed ? 0 : (collapseHeight ?? undefined),
        opacity: collapsed ? 0 : 1,
        transition: deleting ? 'max-height 180ms ease-in, opacity 150ms ease-in' : undefined,
      }}
    >
      {/* Only exists while a swipe is under way: rows use translucent "glass" backgrounds, so a
          permanently-rendered red layer showed through and tinted every row red. */}
      {(dragX < 0 || deleting) && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-end rounded-[inherit] bg-red-600 pr-4"
          style={{ opacity: deleting ? 1 : Math.min(1, Math.abs(dragX) / 40) }}
        >
          <span className="text-sm font-semibold text-on-accent">Delete</span>
        </div>
      )}
      <div
        ref={contentRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        className="relative touch-pan-y select-none"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 200ms ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
