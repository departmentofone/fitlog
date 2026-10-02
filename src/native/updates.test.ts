// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const updater = vi.hoisted(() => ({ set: vi.fn(), notifyAppReady: vi.fn(), list: vi.fn(), download: vi.fn() }))
const app = vi.hoisted(() => ({ getInfo: vi.fn() }))
vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: updater }))
vi.mock('@capacitor/app', () => ({ App: app }))

const { WEB_VERSION, checkForUpdate, switchToDownloadedUpdate } = await import('./updates')
const manifest = (over: object = {}) => ({ version: '1.99990101.1', url: 'https://x/a.zip', checksum: 'abc', minVersionCode: 100, ...over })

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  app.getInfo.mockResolvedValue({ build: '100' })
  updater.list.mockResolvedValue({ bundles: [] })
  updater.download.mockResolvedValue({ id: 'b1', version: '1.99990101.1', status: 'success' })
})

function serve(body: object) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => body })),
  )
}

describe('live updates', () => {
  it('downloads newer web code and lines it up for the next launch', async () => {
    serve(manifest())
    await checkForUpdate()
    expect(updater.download).toHaveBeenCalledWith({ url: 'https://x/a.zip', version: '1.99990101.1', checksum: 'abc' })
    expect(JSON.parse(localStorage.getItem('fitlog-update-pending')!)).toEqual({ id: 'b1', version: '1.99990101.1' })
  })

  it('skips code that needs a newer app than this one', async () => {
    serve(manifest({ minVersionCode: 101 }))
    await checkForUpdate()
    expect(updater.download).not.toHaveBeenCalled()
  })

  it('skips the version already running', async () => {
    serve(manifest({ version: WEB_VERSION }))
    await checkForUpdate()
    expect(updater.download).not.toHaveBeenCalled()
  })

  it('reuses a bundle downloaded on an earlier run', async () => {
    serve(manifest())
    updater.list.mockResolvedValue({ bundles: [{ id: 'old', version: '1.99990101.1', status: 'success' }] })
    await checkForUpdate()
    expect(updater.download).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('fitlog-update-pending')!).id).toBe('old')
  })

  it('switches at launch only to a waiting bundle, once', async () => {
    expect(await switchToDownloadedUpdate()).toBe(false)
    localStorage.setItem('fitlog-update-pending', JSON.stringify({ id: 'b1', version: '1.99990101.1' }))
    expect(await switchToDownloadedUpdate()).toBe(true)
    expect(updater.set).toHaveBeenCalledWith({ id: 'b1' })
    expect(localStorage.getItem('fitlog-update-pending')).toBeNull()
  })

  it('never fails the launch when offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    await expect(checkForUpdate()).resolves.toBeUndefined()
  })
})
