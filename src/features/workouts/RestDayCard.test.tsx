// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RestDayCard } from './RestDayCard'

describe('RestDayCard', () => {
  it('confirms the rest day and undoes it', () => {
    const onUndo = vi.fn()
    render(<RestDayCard date="2026-10-03" streak={4} onUndo={onUndo} />)
    expect(screen.getByRole('status')).toHaveTextContent('Rest day')
    expect(screen.getByRole('status')).toHaveTextContent('4day streak')
    fireEvent.click(screen.getByRole('button', { name: 'Train today after all' }))
    expect(onUndo).toHaveBeenCalledOnce()
  })

  it('disables undo while it is being undone', () => {
    render(<RestDayCard date="2026-10-03" streak={0} onUndo={() => {}} undoing />)
    expect(screen.getByRole('button', { name: 'Undoing…' })).toBeDisabled()
  })

  it('keeps the same tip all day and shows another on request', () => {
    const { unmount } = render(<RestDayCard date="2026-10-03" streak={0} onUndo={() => {}} />)
    const first = screen.getByRole('heading', { level: 3 }).textContent
    unmount()
    render(<RestDayCard date="2026-10-03" streak={0} onUndo={() => {}} />)
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(first)
    fireEvent.click(screen.getByRole('button', { name: 'Another tip' }))
    expect(screen.getByRole('heading', { level: 3 }).textContent).not.toBe(first)
  })
})
