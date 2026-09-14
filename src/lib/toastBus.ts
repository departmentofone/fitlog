type Listener = (message: string) => void
const listeners = new Set<Listener>()

export function emitError(message: string) {
  listeners.forEach((l) => l(message))
}

export function subscribeError(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
