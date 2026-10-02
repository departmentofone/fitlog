import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory stand-ins for Supabase, web-push and Vercel's waitUntil, so the waiting logic can run
// on fake timers.
type Row = Record<string, string>
const rows = new Map<string, Row>()
const sent: { endpoint: string; payload: string; options: unknown }[] = []
const pending: Promise<unknown>[] = []

function table() {
  let op: 'select' | 'delete' | 'upsert' = 'select'
  let returning = false
  let upsertRow: Row | null = null
  const filters: [string, string, boolean][] = []
  const run = () => {
    if (op === 'upsert' && upsertRow) {
      rows.set(upsertRow.endpoint, { ...upsertRow })
      return { data: null, error: null }
    }
    const matched = [...rows.values()].filter((r) => filters.every(([k, v, equal]) => (r[k] === v) === equal))
    if (op === 'delete') {
      matched.forEach((r) => rows.delete(r.endpoint))
      return { data: returning ? matched : null, error: null }
    }
    return { data: matched, error: null }
  }
  const builder = {
    select() {
      if (op === 'delete') returning = true
      return builder
    },
    delete() {
      op = 'delete'
      return builder
    },
    upsert(row: Row) {
      op = 'upsert'
      upsertRow = row
      return builder
    },
    eq(key: string, value: string) {
      filters.push([key, value, true])
      return builder
    },
    neq(key: string, value: string) {
      filters.push([key, value, false])
      return builder
    },
    maybeSingle() {
      const { data } = run()
      return Promise.resolve({ data: (data as Row[])[0] ?? null, error: null })
    },
    then(resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) {
      return Promise.resolve(run()).then(resolve, reject)
    },
  }
  return builder
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => table(),
    auth: {
      getUser: async (token: string) =>
        token === 'user-1' || token === 'user-2'
          ? { data: { user: { id: token } }, error: null }
          : { data: { user: null }, error: { message: 'invalid' } },
    },
  }),
}))
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: async (sub: { endpoint: string }, payload: string, options: unknown) => {
      sent.push({ endpoint: sub.endpoint, payload, options })
    },
  },
}))
// What Vercel's runtime provides and @vercel/functions' waitUntil reads.
;(globalThis as Record<symbol, unknown>)[Symbol.for('@vercel/request-context')] = {
  get: () => ({ waitUntil: (p: Promise<unknown>) => pending.push(p) }),
}

const { default: handler } = await import('../api/rest-alert')

const SUB = { endpoint: 'https://fcm.googleapis.com/fcm/send/device-a', keys: { p256dh: 'p', auth: 'a' } }

async function call(body: unknown, headers: Record<string, string> = { authorization: 'Bearer user-1' }) {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    setHeader: () => res,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(value: unknown) {
      res.body = value
      return res
    },
  }
  await handler({ method: 'POST', headers: { host: 'fitlog.test', ...headers }, body } as never, res as never)
  return res
}

beforeEach(() => {
  vi.useFakeTimers()
  rows.clear()
  sent.length = 0
  pending.length = 0
  Object.assign(process.env, {
    VITE_SUPABASE_URL: 'https://db.example',
    VITE_SUPABASE_ANON_KEY: 'anon',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    VITE_VAPID_PUBLIC_KEY: 'pub',
    VAPID_PRIVATE_KEY: 'priv',
    CRON_SECRET: 'cron-secret',
  })
  // Hand-overs call the function again, as Vercel would.
  vi.stubGlobal('fetch', async (_url: string, init: { headers: Record<string, string>; body: string }) => {
    const headers = Object.fromEntries(Object.entries(init.headers).map(([k, v]) => [k.toLowerCase(), v]))
    const res = await call(JSON.parse(init.body), headers)
    return { ok: res.statusCode < 300, status: res.statusCode, text: async () => '' }
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('api/rest-alert', () => {
  it('sends one "Rest over" push when the rest ends, then forgets it', async () => {
    const start = Date.now()
    expect((await call({ inMs: 90_000, subscription: SUB })).statusCode).toBe(202)
    await vi.advanceTimersByTimeAsync(89_000)
    expect(sent).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1_500)
    expect(sent).toHaveLength(1)
    expect(sent[0].endpoint).toBe(SUB.endpoint)
    expect(JSON.parse(sent[0].payload)).toMatchObject({ kind: 'rest', title: 'Rest over', endsAt: 90_000 + start })
    expect(sent[0].options).toMatchObject({ urgency: 'high' })
    expect(rows.size).toBe(0)
    await vi.advanceTimersByTimeAsync(600_000)
    expect(sent).toHaveLength(1)
  })

  it('only the latest arm alerts (start again, +15s)', async () => {
    await call({ inMs: 90_000, subscription: SUB })
    let firstWaitEnded = false
    void pending[0].then(() => (firstWaitEnded = true))
    await vi.advanceTimersByTimeAsync(30_000)
    await call({ inMs: 75_000, subscription: SUB })
    // The replaced wait notices at its next check and stops, instead of idling until the end.
    await vi.advanceTimersByTimeAsync(10_500)
    expect(firstWaitEnded).toBe(true)
    await vi.advanceTimersByTimeAsync(50_500)
    expect(sent).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(sent).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(600_000)
    expect(sent).toHaveLength(1)
  })

  it('a cancelled rest sends nothing', async () => {
    await call({ inMs: 90_000, subscription: SUB })
    await vi.advanceTimersByTimeAsync(50_000)
    expect((await call({ inMs: null, subscription: SUB })).statusCode).toBe(200)
    await vi.advanceTimersByTimeAsync(600_000)
    expect(sent).toHaveLength(0)
  })

  it("another account can't cancel this device's alert", async () => {
    await call({ inMs: 60_000, subscription: SUB })
    await call({ inMs: null, subscription: SUB }, { authorization: 'Bearer user-2' })
    await vi.advanceTimersByTimeAsync(61_000)
    expect(sent).toHaveLength(1)
  })

  it('hands a long wait to one fresh invocation and still alerts once, on time', async () => {
    const fetchSpy = vi.fn(globalThis.fetch)
    vi.stubGlobal('fetch', fetchSpy)
    await call({ inMs: 400_000, subscription: SUB })
    await vi.advanceTimersByTimeAsync(399_000)
    expect(sent).toHaveLength(0)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
    expect(url).toBe('https://fitlog.test/api/rest-alert')
    expect(init.headers['X-Rest-Alert-Secret']).toBe('cron-secret')
    await vi.advanceTimersByTimeAsync(1_500)
    expect(sent).toHaveLength(1)
  })

  it("refuses to arm when it can't keep waiting after the response", async () => {
    const key = Symbol.for('@vercel/request-context')
    const context = (globalThis as Record<symbol, unknown>)[key]
    delete (globalThis as Record<symbol, unknown>)[key]
    try {
      expect((await call({ inMs: 90_000, subscription: SUB })).statusCode).toBe(503)
    } finally {
      ;(globalThis as Record<symbol, unknown>)[key] = context
    }
  })

  it('accepts the push services of every major browser', async () => {
    for (const endpoint of [
      'https://web.push.apple.com/QGuQ',
      'https://updates.push.services.mozilla.com/wpush/v2/x',
      'https://wns2-par02p.notify.windows.com/w/?token=x',
    ]) {
      expect((await call({ inMs: 90_000, subscription: { endpoint, keys: SUB.keys } })).statusCode).toBe(202)
    }
  })

  it('caps how many devices one account can have waiting', async () => {
    for (let i = 0; i < 5; i++) {
      const endpoint = `https://fcm.googleapis.com/fcm/send/device-${i}`
      expect((await call({ inMs: 90_000, subscription: { endpoint, keys: SUB.keys } })).statusCode).toBe(202)
    }
    expect((await call({ inMs: 90_000, subscription: SUB })).statusCode).toBe(429)
    // Re-arming a device that's already waiting is always fine.
    expect((await call({ inMs: 60_000, subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/device-0', keys: SUB.keys } })).statusCode).toBe(202)
  })

  it('rejects bad requests', async () => {
    expect((await call({ inMs: 90_000, subscription: SUB }, {})).statusCode).toBe(401)
    expect((await call({ inMs: 90_000, subscription: SUB }, { authorization: 'Bearer nope' })).statusCode).toBe(401)
    expect((await call({ inMs: 90_000, subscription: { endpoint: 'http://fcm.googleapis.com/x', keys: SUB.keys } })).statusCode).toBe(400)
    // Only real push services: anything else would have the server post wherever the caller says.
    expect((await call({ inMs: 90_000, subscription: { endpoint: 'https://attacker.example/x', keys: SUB.keys } })).statusCode).toBe(400)
    expect((await call({ inMs: 90_000, subscription: { endpoint: 'https://fcm.googleapis.com.attacker.example/x', keys: SUB.keys } })).statusCode).toBe(400)
    expect((await call({ inMs: -1, subscription: SUB })).statusCode).toBe(400)
    expect((await call({ inMs: 600_000, subscription: SUB })).statusCode).toBe(400)
    expect((await call({ continue: { endpoint: SUB.endpoint, token: 'x' } }, { 'x-rest-alert-secret': 'wrong' })).statusCode).toBe(401)
    expect(rows.size).toBe(0)
  })
})
