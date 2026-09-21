// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SwipeToDelete } from './SwipeToDelete'

// jsdom has no PointerEvent, so fireEvent.pointer* would drop clientX/pointerId. A MouseEvent
// subclass carrying the two pointer fields the component reads is enough.
class TestPointerEvent extends MouseEvent {
  pointerId: number
  pointerType: string
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
    this.pointerType = init.pointerType ?? 'mouse'
  }
}
window.PointerEvent ??= TestPointerEvent as unknown as typeof PointerEvent

describe('SwipeToDelete', () => {
  it('renders no red delete layer while the row is at rest', () => {
    // Rows use translucent backgrounds, so a layer rendered behind them at rest tinted every
    // meal entry red.
    render(
      <SwipeToDelete onDelete={vi.fn()}>
        <span>Egg, whole · 50g</span>
      </SwipeToDelete>,
    )
    expect(screen.getByText('Egg, whole · 50g')).toBeTruthy()
    expect(screen.queryByText('Delete')).toBeNull()
  })

  it('reveals the delete layer only once a horizontal swipe starts', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()}>
        <span>Egg, whole · 50g</span>
      </SwipeToDelete>,
    )
    const row = screen.getByText('Egg, whole · 50g').parentElement!
    // jsdom lays nothing out; the drag distance is clamped to the row's width.
    vi.spyOn(row.parentElement!, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 44 } as DOMRect)
    // jsdom has no pointer capture; the component only needs these to exist.
    row.setPointerCapture = vi.fn()
    row.hasPointerCapture = vi.fn(() => true)
    row.releasePointerCapture = vi.fn()

    fireEvent.pointerDown(row, { pointerId: 1, clientX: 200, clientY: 10, button: 0, pointerType: 'touch' })
    fireEvent.pointerMove(row, { pointerId: 1, clientX: 150, clientY: 11, pointerType: 'touch' })
    expect(screen.getByText('Delete')).toBeTruthy()

    // Letting go short of the threshold snaps back and hides it again.
    fireEvent.pointerUp(row, { pointerId: 1, clientX: 150, clientY: 11, pointerType: 'touch' })
    expect(screen.queryByText('Delete')).toBeNull()
  })
})
