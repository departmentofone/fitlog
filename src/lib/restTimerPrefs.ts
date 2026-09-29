import { useSyncExternalStore } from 'react'

/**
 * Rest timer switches, per device like the rest length (fitlog-rest-seconds): notification
 * permission is per device anyway. Both default to on.
 */
const KEYS = {
  autoStart: 'fitlog-rest-autostart',
  notifications: 'fitlog-rest-notifications',
} as const

export type RestTimerPref = keyof typeof KEYS

const listeners = new Set<() => void>()

export function getRestTimerPref(pref: RestTimerPref): boolean {
  try {
    return localStorage.getItem(KEYS[pref]) !== '0'
  } catch {
    return true
  }
}

export function setRestTimerPref(pref: RestTimerPref, on: boolean) {
  try {
    localStorage.setItem(KEYS[pref], on ? '1' : '0')
  } catch {
    // Storage unavailable: the switch still flips for this session's listeners below.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useRestTimerPref(pref: RestTimerPref): boolean {
  return useSyncExternalStore(subscribe, () => getRestTimerPref(pref), () => true)
}
