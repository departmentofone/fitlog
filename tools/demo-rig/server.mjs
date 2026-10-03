// Demo rig for FitLog: store screenshots, design reviews, visual checks. Runs the local dev build
// in headless Chrome at 360x640 @3x and answers every Supabase request from an in-memory demo database (a small PostgREST + auth
// emulator), so nothing is read from or written to the real project. All other off-site requests
// are failed, except Google Fonts (Sora). A tiny HTTP control API drives it:
//   GET /eval?js=...   evaluate in the page (awaits promises, returns JSON)
//   GET /shot?name=... capture the viewport to out/<name>.png
//   GET /viewport?w=&h=&s=   change the emulated viewport
//   GET /reload        reload the app with fresh demo data
//   GET /quit
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDemo, USER } from './demo.mjs'

const HERE = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const OUT = process.env.OUT_DIR || HERE + 'out'
const APP = process.env.APP_URL || 'http://localhost:5173'
const REFERRER = process.env.REFERRER || undefined
const PORT = Number(process.env.RIG_PORT || 9400)
const SUPA_HOST = 'uxmdzudoojexfcoircoo.supabase.co'
const REF = SUPA_HOST.split('.')[0]
mkdirSync(OUT, { recursive: true })
// Chrome's profile lives in the system temp folder: inside the repo, Vite's file watcher tripped
// over Chrome's locked cookie file and the dev server crashed.
const PROFILE = process.env.PROFILE_DIR || join(tmpdir(), 'fitlog-demo-rig-profile-' + PORT)
rmSync(PROFILE, { recursive: true, force: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let catalog = JSON.parse(readFileSync(HERE + 'catalog.json', 'utf8'))
let db = buildDemo(catalog)

// ---------------------------------------------------------------- PostgREST emulator
const FK = [
  ['workout_sets', 'session_id', 'workout_sessions'],
  ['workout_sets', 'exercise_id', 'exercises'],
  ['workout_preset_items', 'preset_id', 'workout_presets'],
  ['workout_preset_items', 'exercise_id', 'exercises'],
  ['recipe_ingredients', 'recipe_id', 'recipes'],
  ['recipe_ingredients', 'food_id', 'foods'],
  ['meal_preset_items', 'preset_id', 'meal_presets'],
  ['meal_preset_items', 'food_id', 'foods'],
  ['meal_plan_items', 'plan_id', 'meal_plans'],
  ['meal_plan_items', 'food_id', 'foods'],
  ['meal_plans', 'diet_id', 'diets'],
  ['diet_foods', 'diet_id', 'diets'],
  ['diet_foods', 'food_id', 'foods'],
  ['meal_items', 'meal_id', 'meals'],
  ['meal_items', 'food_id', 'foods'],
  ['goals', 'target_exercise_id', 'exercises'],
  ['food_labels', 'food_id', 'foods'],
  ['exercise_notes', 'exercise_id', 'exercises'],
]

function splitTop(s, sep = ',') {
  const out = []
  let depth = 0, cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === sep && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out.map((x) => x.trim()).filter(Boolean)
}

function parseSelect(sel) {
  return splitTop(sel || '*').map((item) => {
    const m = item.match(/^(?:([\w]+):)?([\w]+)(!inner)?\((.*)\)$/s)
    if (m) return { embed: true, alias: m[1] || m[2], table: m[2], inner: !!m[3], sub: parseSelect(m[4]) }
    const [alias, col] = item.includes(':') ? item.split(':') : [item, item]
    return { embed: false, alias, col: col.split('::')[0] }
  })
}

function relation(parent, target, alias) {
  const m2o = FK.filter(([c, , p]) => c === parent && p === target)
  if (m2o.length) {
    const pick = m2o.find(([, col]) => col === alias + '_id') || m2o[0]
    return { kind: 'm2o', col: pick[1] }
  }
  const o2m = FK.find(([c, , p]) => c === target && p === parent)
  if (o2m) return { kind: 'o2m', col: o2m[1] }
  throw new Error(`no relation ${parent} -> ${target}`)
}

function project(table, row, items) {
  const out = {}
  for (const it of items) {
    if (!it.embed) {
      if (it.col === '*') Object.assign(out, row)
      else out[it.alias] = row[it.col] ?? null
      continue
    }
    const rel = relation(table, it.table, it.alias)
    if (rel.kind === 'm2o') {
      const target = (db[it.table] || []).find((r) => r.id === row[rel.col])
      out[it.alias] = target ? project(it.table, target, it.sub) : null
    } else {
      out[it.alias] = (db[it.table] || []).filter((r) => r[rel.col] === row.id).map((r) => project(it.table, r, it.sub))
    }
  }
  return out
}

function coerce(rowVal, v) {
  if (v === 'null') return null
  if (typeof rowVal === 'number') return Number(v)
  if (typeof rowVal === 'boolean') return v === 'true'
  return v
}

function test(rowVal, op, raw) {
  if (op.startsWith('not.')) return !test(rowVal, op.slice(4), raw)
  const v = coerce(rowVal, raw)
  switch (op) {
    case 'eq': return rowVal === v || String(rowVal) === String(v)
    case 'neq': return !(rowVal === v || String(rowVal) === String(v))
    case 'gt': return rowVal != null && rowVal > v
    case 'gte': return rowVal != null && rowVal >= v
    case 'lt': return rowVal != null && rowVal < v
    case 'lte': return rowVal != null && rowVal <= v
    case 'is': return raw === 'null' ? rowVal == null : rowVal === (raw === 'true')
    case 'in': {
      const list = raw.replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, ''))
      return list.some((x) => String(rowVal) === x)
    }
    case 'like':
    case 'ilike': {
      const re = new RegExp('^' + raw.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*%]/g, '.*') + '$', op === 'ilike' ? 'i' : '')
      return rowVal != null && re.test(String(rowVal))
    }
    case 'cs': return Array.isArray(rowVal) && JSON.parse(raw.replace(/^\{/, '[').replace(/\}$/, ']')).every((x) => rowVal.includes(x))
  }
  throw new Error('op ' + op)
}

function parseCond(expr) {
  // "col=op.value" style split already done by caller: returns {path, op, value}
  const m = expr.match(/^(not\.)?(eq|neq|gt|gte|lt|lte|is|in|like|ilike|cs)\.(.*)$/s)
  if (!m) throw new Error('cond ' + expr)
  return { op: (m[1] || '') + m[2], value: m[3] }
}

function getPath(row, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), row)
}

function query(table, params) {
  const items = parseSelect(params.get('select'))
  let rows = (db[table] || []).slice()
  const embedFilters = []
  for (const [k, val] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue
    if (k === 'or') {
      const conds = splitTop(val.replace(/^\(|\)$/g, '')).map((c) => {
        const [col, ...rest] = c.split('.')
        return { col, ...parseCond(rest.join('.')) }
      })
      rows = rows.filter((r) => conds.some((c) => test(r[c.col], c.op, c.value)))
      continue
    }
    const c = parseCond(val)
    if (k.includes('.')) embedFilters.push({ path: k, ...c })
    else rows = rows.filter((r) => test(r[k], c.op, c.value))
  }
  const order = params.get('order')
  if (order) {
    const keys = order.split(',').map((o) => { const [col, dir = 'asc'] = o.split('.'); return { col, desc: dir === 'desc' } })
    rows.sort((a, b) => {
      for (const { col, desc } of keys) {
        const x = a[col], y = b[col]
        if (x === y) continue
        if (x == null) return 1
        if (y == null) return -1
        return (x < y ? -1 : 1) * (desc ? -1 : 1)
      }
      return 0
    })
  }
  let out = rows.map((r) => project(table, r, items))
  // Embedded filters and !inner: drop parents whose embed is missing or filtered away.
  for (const it of items.filter((i) => i.embed)) {
    const fs = embedFilters.filter((f) => f.path.startsWith(it.alias + '.'))
    if (fs.length) {
      out = out.flatMap((r) => {
        const e = r[it.alias]
        if (Array.isArray(e)) {
          r[it.alias] = e.filter((x) => fs.every((f) => test(getPath(x, f.path.slice(it.alias.length + 1)), f.op, f.value)))
          return [r]
        }
        if (e == null) return it.inner ? [] : [r]
        const ok = fs.every((f) => test(getPath(e, f.path.slice(it.alias.length + 1)), f.op, f.value))
        if (ok) return [r]
        if (it.inner) return []
        r[it.alias] = null
        return [r]
      })
    }
    if (it.inner) out = out.filter((r) => (Array.isArray(r[it.alias]) ? r[it.alias].length > 0 : r[it.alias] != null))
  }
  const offset = Number(params.get('offset') || 0)
  const limit = params.has('limit') ? Number(params.get('limit')) : Infinity
  return out.slice(offset, offset + limit)
}

function matchRows(table, params) {
  let rows = db[table] || []
  for (const [k, val] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue
    const c = parseCond(val)
    rows = rows.filter((r) => test(r[k], c.op, c.value))
  }
  return rows
}

function withDefaults(table, row) {
  const now = new Date().toISOString()
  const r = { ...row }
  if (!('id' in r) && !['user_settings', 'diet_foods'].includes(table)) r.id = randomUUID()
  if (!('created_at' in r) && table !== 'diet_foods') r.created_at = now
  return r
}

function rest(method, table, params, headers, body) {
  db[table] ||= []
  const prefer = headers['Prefer'] || headers['prefer'] || ''
  const wantRep = prefer.includes('return=representation')
  const sel = params.get('select') || '*'
  const pick = (rows) => rows.map((r) => project(table, r, parseSelect(sel)))
  if (method === 'GET' || method === 'HEAD') return { status: 200, data: query(table, params) }
  if (method === 'POST') {
    const list = (Array.isArray(body) ? body : [body]).map((r) => withDefaults(table, r))
    const conflict = params.get('on_conflict')
    const saved = []
    for (const r of list) {
      if (conflict && prefer.includes('resolution=merge-duplicates')) {
        const keys = conflict.split(',')
        const hit = db[table].find((x) => keys.every((k) => x[k] === r[k]))
        if (hit) { const { id, created_at, ...rest } = r; Object.assign(hit, rest, hit.id ? {} : { id }); saved.push(hit); continue }
      }
      db[table].push(r); saved.push(r)
    }
    return { status: 201, data: wantRep ? pick(saved) : null }
  }
  if (method === 'PATCH') {
    const rows = matchRows(table, params)
    rows.forEach((r) => Object.assign(r, body))
    return { status: wantRep ? 200 : 204, data: wantRep ? pick(rows) : null }
  }
  if (method === 'DELETE') {
    const rows = matchRows(table, params)
    db[table] = db[table].filter((r) => !rows.includes(r))
    return { status: wantRep ? 200 : 204, data: wantRep ? pick(rows) : null }
  }
  return { status: 405, data: { message: 'method' } }
}


// A brand-new account: everything the demo user owns is gone (catalog and official items stay),
// settings are first-run defaults with health consent already given.
function emptyDemo(d) {
  for (const t of Object.keys(d)) if (Array.isArray(d[t]) && t !== 'user_settings') d[t] = d[t].filter((r) => r.user_id !== USER.id)
  let changed = true
  while (changed) {
    changed = false
    for (const [child, col, parent] of FK) {
      if (!d[child] || !d[parent]) continue
      const ids = new Set(d[parent].map((r) => r.id))
      const before = d[child].length
      d[child] = d[child].filter((r) => r[col] == null || ids.has(r[col]))
      if (d[child].length !== before) changed = true
    }
  }
  d.user_settings = [{ user_id: USER.id, health_data_consent_at: '2026-06-01T09:01:00Z', unit_system: 'metric', theme: 'dark', color_palette: 'emerald', haptics_enabled: true, ask_preworkout: false, bottom_nav_tabs: [], enabled_food_packs: [], hidden_community_users: [], updated_at: new Date().toISOString() }]
  return d
}

// ---------------------------------------------------------------- auth
const now = Math.floor(Date.now() / 1000)
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const fakeJwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER.id, role: 'authenticated', exp: now + 86400 * 30, email: USER.email })}.demo`
const session = { access_token: fakeJwt, token_type: 'bearer', expires_in: 86400 * 30, expires_at: now + 86400 * 30, refresh_token: 'demo', user: USER }

function supabaseResponse(url, method, headers, body) {
  const path = url.pathname
  if (path.startsWith('/auth/v1/')) {
    if (path.endsWith('/user')) return { status: 200, data: USER }
    if (path.endsWith('/token') || path.endsWith('/signup') || path.endsWith('/otp') || path.endsWith('/recover')) log.push('AUTH ' + path.split('/').pop() + ' captcha_token=' + JSON.stringify(body?.gotrue_meta_security?.captcha_token ?? null).slice(0, 40))
    if (path.endsWith('/token')) return { status: 200, data: session }
    if (path.endsWith('/logout')) return { status: 204, data: null }
    return { status: 200, data: {} }
  }
  if (path.startsWith('/rest/v1/rpc/')) return { status: 200, data: path.endsWith('is_site_owner') ? false : null }
  if (path.startsWith('/rest/v1/')) {
    const table = path.slice('/rest/v1/'.length)
    const r = rest(method, table, url.searchParams, headers, body)
    const accept = headers['Accept'] || headers['accept'] || ''
    if (accept.includes('vnd.pgrst.object') && Array.isArray(r.data)) {
      if (r.data.length !== 1) return { status: 406, data: { code: 'PGRST116', details: `The result contains ${r.data.length} rows`, hint: null, message: 'JSON object requested, multiple (or no) rows returned' } }
      r.data = r.data[0]
    }
    return r
  }
  return { status: 404, data: { message: 'not in demo' } }
}

// ---------------------------------------------------------------- Chrome + CDP
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=' + (PORT - 65), '--window-size=500,900',
  '--user-data-dir=' + PROFILE, '--disable-web-security', '--no-first-run', '--force-color-profile=srgb', 'about:blank',
])
let targets
for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT - 65}/json/list`)).json(); if (targets.length) break } catch {} await sleep(250) }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
const log = []
ws.onmessage = async (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.error ? { error: m.error } : m.result); pending.delete(m.id); return }
  if (m.method === 'Fetch.requestPaused') handlePaused(m.params)
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) log.push(m.params.type + ': ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300))
  if (m.method === 'ServiceWorker.workerErrorReported') log.push('sw error: ' + JSON.stringify(m.params.errorMessage).slice(0, 400))
  if (m.method === 'ServiceWorker.workerVersionUpdated') for (const v of m.params.versions) log.push('sw version: ' + v.status + ' ' + v.runningStatus)
  if (m.method === 'Log.entryAdded' && /turnstile|cloudflare|1102|1060|600010/i.test(m.params.entry.text)) log.push('TS-LOG: ' + m.params.entry.text.slice(0, 300))
  if (m.method === 'Runtime.consoleAPICalled' && /turnstile|cloudflare/i.test(JSON.stringify(m.params.args))) log.push('TS-CONSOLE: ' + JSON.stringify(m.params.args.map((a) => a.value ?? a.description)).slice(0, 300))
  if (m.method === 'Log.entryAdded' && /Content Security Policy|Refused to/i.test(m.params.entry.text)) log.push('CSP: ' + m.params.entry.text.slice(0, 400))
  if (m.method === 'Runtime.exceptionThrown') log.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300))
}
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })

const blocked = new Set()
async function handlePaused(p) {
  const url = new URL(p.request.url)
  const cors = [
    { name: 'Access-Control-Allow-Origin', value: APP },
    { name: 'Access-Control-Allow-Credentials', value: 'true' },
    { name: 'Access-Control-Allow-Headers', value: '*' },
    { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,PUT,DELETE,OPTIONS' },
    { name: 'Access-Control-Expose-Headers', value: 'Content-Range' },
  ]
  if (url.hostname === SUPA_HOST) {
    let body = null
    try { body = p.request.postData ? JSON.parse(p.request.postData) : null } catch {}
    if (p.request.method === 'OPTIONS') return send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 204, responseHeaders: cors })
    let r
    try { r = supabaseResponse(url, p.request.method, p.request.headers, body) } catch (err) {
      log.push('emulator: ' + err.message + ' ' + url.pathname + url.search)
      r = { status: 400, data: { message: String(err.message) } }
    }
    const text = r.data == null ? '' : JSON.stringify(r.data)
    const n = Array.isArray(r.data) ? r.data.length : 1
    return send('Fetch.fulfillRequest', {
      requestId: p.requestId, responseCode: r.status,
      responseHeaders: [...cors, { name: 'Content-Type', value: 'application/json' }, { name: 'Content-Range', value: `0-${Math.max(n - 1, 0)}/${n}` }],
      body: Buffer.from(text).toString('base64'),
    })
  }
  const local = ['localhost', '127.0.0.1', new URL(APP).hostname].includes(url.hostname) || url.protocol === 'data:' || url.protocol === 'blob:'
  const fonts = ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) && p.request.method === 'GET'
  if (local || fonts) return send('Fetch.continueRequest', { requestId: p.requestId })
  if (p.request.postData && url.hostname === 'department-of-one.vercel.app') log.push('FEEDBACK POST turnstileToken=' + JSON.stringify(JSON.parse(p.request.postData).turnstileToken ?? null).slice(0, 40))
  blocked.add(url.hostname)
  return send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'BlockedByClient' })
}

const storageKey = `sb-${REF}-auth-token`
async function boot() {
  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 640, deviceScaleFactor: 3, mobile: true })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })
  await send('Fetch.enable', { patterns: process.env.SUPABASE_ONLY ? [{ urlPattern: '*supabase.co*' }] : [{ urlPattern: '*' }] })
  if (process.env.GRANT_NOTIFICATIONS) await send('Browser.grantPermissions', { origin: APP, permissions: ['notifications'] })
  await send('Runtime.enable')
  await send('Log.enable')
  await send('ServiceWorker.enable')
  await send('Page.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: process.env.NO_SESSION ? '' : `try {
      localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(session))});
      localStorage.setItem('fitlog-onboarded-v2', '1');
    } catch (e) {}`,
  })
  // A Play (TWA) launch: Chrome reports document.referrer = android-app://<package>/ on the first
  // page load only. Emulate exactly that, then remove the override so reloads look normal.
  let once
  if (REFERRER) once = await send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(Document.prototype, 'referrer', { get: () => ${JSON.stringify(REFERRER)}, configurable: true })` })
  await send('Page.navigate', { url: APP + (process.env.START || '/') + '#/workouts' })
  await sleep(6000)
  if (once) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: once.identifier })
}
await boot()

const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, replMode: true })
  return r.exceptionDetails ? { error: r.exceptionDetails.exception?.description || r.exceptionDetails.text } : r.result?.value
}

createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  let out
  try {
    if (u.pathname === '/eval') out = await ev(u.searchParams.get('js'))
    else if (u.pathname === '/shot') {
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      const f = `${OUT}/${u.searchParams.get('name')}.png`
      writeFileSync(f, Buffer.from(shot.data, 'base64'))
      out = f
    } else if (u.pathname === '/viewport') {
      out = await send('Emulation.setDeviceMetricsOverride', { width: +u.searchParams.get('w'), height: +u.searchParams.get('h'), deviceScaleFactor: +u.searchParams.get('s'), mobile: true })
    } else if (u.pathname === '/reload') {
      catalog = JSON.parse(readFileSync(HERE + 'catalog.json', 'utf8'))
      db = (await import('./demo.mjs?' + Date.now())).buildDemo(catalog)
      if (u.searchParams.get('empty')) db = emptyDemo(db)
      await send('Runtime.evaluate', { expression: 'localStorage.removeItem("fitlog-query-cache")' })
      await send('Page.navigate', { url: APP + '/#/' + (u.searchParams.get('route') || 'workouts') })
      await send('Page.reload', { ignoreCache: true })
      await sleep(6000)
      out = 'ok'
    } else if (u.pathname === '/log') { out = { log: log.splice(0), blocked: [...blocked] } }
    else if (u.pathname === '/hide') { const t = await send('Target.createTarget', { url: 'about:blank' }); await sleep(800); out = { other: t.targetId, visibility: await ev('document.visibilityState') } }
    else if (u.pathname === '/front') { await send('Target.activateTarget', { targetId: targets.find((t) => t.type === 'page').id }); await sleep(800); out = await ev('document.visibilityState') }
    else if (u.pathname === '/db') { out = (db[u.searchParams.get('t')] || []).slice(0, 50) }
    else if (u.pathname === '/quit') { res.end('bye'); ws.close(); chrome.kill(); process.exit(0) }
  } catch (err) { out = { error: String(err) } }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(out, null, 1))
}).listen(PORT, () => console.log('rig ready on :' + PORT))
