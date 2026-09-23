// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RestDayCard } from './RestDayCard'

describe('RestDayCard', () => {
  it('confirms the rest day and undoes it', () => {
    const onUndo = vi.fn()
    render(<RestDayCard onUndo={onUndo} />)
    expect(screen.getByRole('status')).toHaveTextContent('Rest day logged')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledOnce()
  })

  it('disables Undo while it is being undone', () => {
    render(<RestDayCard onUndo={() => {}} undoing />)
    expect(screen.getByRole('button', { name: 'Undoing…' })).toBeDisabled()
  })
})
