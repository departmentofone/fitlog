// @vitest-environment jsdom
import { act, render, waitFor } from '@testing-library/react'
import { onlineManager, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '../lib/queryClient'
import { usePendingMutations } from './usePendingMutations'

function Banner() {
  return <span data-testid="pending">{usePendingMutations()}</span>
}

// Like SessionTimer: useMutation constructs its MutationObserver during render, which
// synchronously notifies the mutation cache with an `observerOptionsUpdated` event.
function Timer({ id }: { id: number }) {
  useMutation({ mutationFn: async () => id })
  return null
}

function App() {
  const [timers, setTimers] = useState(0)
  return (
    <QueryClientProvider client={queryClient}>
      <Banner />
      <button onClick={() => setTimers((n) => n + 1)}>add</button>
      {Array.from({ length: timers }, (_, i) => (
        <Timer key={i} id={i} />
      ))}
    </QueryClientProvider>
  )
}

describe('usePendingMutations', () => {
  afterEach(() => vi.restoreAllMocks())

  it('does not update during another component render when a mutation observer mounts', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { getByText, getByTestId } = render(<App />)
    for (let i = 0; i < 3; i++) {
      act(() => getByText('add').click())
    }
    const renderPhaseWarnings = errors.mock.calls.filter((args) =>
      String(args[0]).includes('Cannot update a component'),
    )
    expect(renderPhaseWarnings).toEqual([])
    expect(getByTestId('pending').textContent).toBe('0')
  })

  it('counts mutations paused while offline and clears them on reconnect', async () => {
    const { getByTestId, unmount } = render(<App />)
    onlineManager.setOnline(false)
    try {
      let done!: Promise<unknown>
      act(() => {
        done = queryClient.getMutationCache().build(queryClient, { mutationFn: async () => 1 }).execute(undefined)
      })
      await waitFor(() => expect(getByTestId('pending').textContent).toBe('1'))
      onlineManager.setOnline(true)
      await act(() => done)
      await waitFor(() => expect(getByTestId('pending').textContent).toBe('0'))
    } finally {
      onlineManager.setOnline(true)
      unmount()
    }
  })
})
