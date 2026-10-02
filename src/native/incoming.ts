import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'

/** Text shared into FitLog from another app (android/.../IncomingPlugin.java). */
interface IncomingPlugin {
  takeSharedText(): Promise<{ text: string | null }>
  addListener(event: 'shared', listener: (data: { text: string }) => void): Promise<PluginListenerHandle>
}

export const Incoming = registerPlugin<IncomingPlugin>('Incoming')
