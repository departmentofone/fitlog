import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'

/**
 * FitLog's own rest timer plugin (android/app/src/main/java/.../RestTimerPlugin.java and
 * RestTimerService.java): a silent countdown notification that Android counts down itself, and a
 * "Rest over" alert at the end, on time even with the screen off. Android only for now.
 */
type PermissionValue = 'granted' | 'denied' | 'prompt'

interface RestTimerPlugin {
  start(options: { endsAt: number }): Promise<void>
  stop(): Promise<void>
  current(): Promise<{ endsAt: number | null }>
  checkPermissions(): Promise<{ notifications: PermissionValue }>
  requestPermissions(): Promise<{ notifications: PermissionValue }>
  pushAvailable(): Promise<{ available: boolean }>
  /** The notification's +15s or Skip, or the end of the rest, changed things. endsAt null = over. */
  addListener(event: 'changed', listener: (data: { endsAt: number | null }) => void): Promise<PluginListenerHandle>
}

export const RestTimer = registerPlugin<RestTimerPlugin>('RestTimer')
