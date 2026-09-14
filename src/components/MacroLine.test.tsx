// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MacroLine } from './MacroLine'

describe('MacroLine', () => {
  it('renders rounded protein, carbs, and fat', () => {
    render(<MacroLine macros={{ calories: 250, protein: 24.6, carbs: 10.2, fat: 5.5 }} />)
    expect(screen.getByText('P 25g')).toBeInTheDocument()
    expect(screen.getByText('C 10g')).toBeInTheDocument()
    expect(screen.getByText('F 6g')).toBeInTheDocument()
  })

  it('does not render a calories figure (that is the caller\'s job)', () => {
    render(<MacroLine macros={{ calories: 250, protein: 0, carbs: 0, fat: 0 }} />)
    expect(screen.queryByText(/250/)).not.toBeInTheDocument()
  })
})
