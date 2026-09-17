import { useState } from 'react'

export type ShareCardType = 'pr' | 'streak' | 'tier' | 'first'

/** What's being celebrated. `value` is rendered huge (e.g. "25 PRs", "30-Day Streak", "Gold"). */
export interface ShareCardData {
  type: ShareCardType
  title: string
  value: string
  subtitle?: string
}

const TYPE_ICON: Record<ShareCardType, string> = { pr: '\u{1F3C6}', streak: '\u{1F525}', tier: '\u{1F947}', first: '✨' }
const TYPE_EYEBROW: Record<ShareCardType, string> = { pr: 'PR MILESTONE', streak: 'STREAK', tier: 'TIER UNLOCKED', first: 'FIRST' }

// Portrait, sized generously for crisp exports on high-DPI phones.
const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Redraws the app's `LogoMark` SVG (Layout.tsx) onto canvas, centered at (cx, cy). */
function drawLogoMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const scale = size / 512
  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)
  roundRectPath(ctx, 0, 0, size, size, 160 * scale)
  ctx.fillStyle = '#0b0f1e'
  ctx.fill()
  ctx.strokeStyle = '#34d399'
  ctx.lineWidth = 34 * scale
  ctx.lineCap = 'round'
  const lines: [number, number, number, number][] = [
    [96, 256, 416, 256],
    [150, 176, 150, 336],
    [362, 176, 362, 336],
    [96, 208, 96, 304],
    [416, 208, 416, 304],
  ]
  ctx.beginPath()
  for (const [x1, y1, x2, y2] of lines) {
    ctx.moveTo(x1 * scale, y1 * scale)
    ctx.lineTo(x2 * scale, y2 * scale)
  }
  ctx.stroke()
  ctx.restore()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Draws the shareable milestone card onto a canvas, sized for a portrait share image.
 * Deliberately avoids backdrop-filter/blur (not capturable off-screen) - the glow is a plain
 * radial gradient instead, which rasterizes identically to how it looks on screen.
 */
function drawShareCard(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  const w = CARD_WIDTH
  const h = CARD_HEIGHT

  // Base background.
  ctx.fillStyle = '#0b0f1e'
  ctx.fillRect(0, 0, w, h)

  // Ambient glow blobs, echoing Layout's fixed ambient glows but as plain radial gradients.
  const emeraldGlow = ctx.createRadialGradient(w * 0.08, h * 0.06, 0, w * 0.08, h * 0.06, w * 0.55)
  emeraldGlow.addColorStop(0, 'rgba(52, 211, 153, 0.35)')
  emeraldGlow.addColorStop(1, 'rgba(52, 211, 153, 0)')
  ctx.fillStyle = emeraldGlow
  ctx.fillRect(0, 0, w, h)

  const amberGlow = ctx.createRadialGradient(w * 0.95, h * 0.92, 0, w * 0.95, h * 0.92, w * 0.6)
  amberGlow.addColorStop(0, 'rgba(251, 191, 36, 0.22)')
  amberGlow.addColorStop(1, 'rgba(251, 191, 36, 0)')
  ctx.fillStyle = amberGlow
  ctx.fillRect(0, 0, w, h)

  // Subtle vertical gradient overlay for depth.
  const depth = ctx.createLinearGradient(0, 0, 0, h)
  depth.addColorStop(0, 'rgba(11, 15, 30, 0)')
  depth.addColorStop(1, 'rgba(11, 15, 30, 0.55)')
  ctx.fillStyle = depth
  ctx.fillRect(0, 0, w, h)

  const cx = w / 2

  // Eyebrow icon.
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '160px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
  ctx.fillText(TYPE_ICON[data.type], cx, 430)

  // Eyebrow label.
  ctx.font = '600 34px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = '#34d399'
  ctx.save()
  ctx.textAlign = 'center'
  const eyebrow = TYPE_EYEBROW[data.type]
  // letter-spacing emulation
  drawLetterSpaced(ctx, eyebrow, cx, 510, 4)
  ctx.restore()

  // Huge value.
  ctx.fillStyle = '#ffffff'
  let valueFontSize = 138
  ctx.font = `800 ${valueFontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`
  while (ctx.measureText(data.value).width > w - 120 && valueFontSize > 60) {
    valueFontSize -= 6
    ctx.font = `800 ${valueFontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`
  }
  ctx.fillText(data.value, cx, 660)

  // Title.
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 48px system-ui, -apple-system, "Segoe UI", sans-serif'
  const titleLines = wrapText(ctx, data.title, w - 160)
  let titleY = 740
  for (const line of titleLines) {
    ctx.fillText(line, cx, titleY)
    titleY += 58
  }

  // Subtitle.
  if (data.subtitle) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '400 34px system-ui, -apple-system, "Segoe UI", sans-serif'
    const subLines = wrapText(ctx, data.subtitle, w - 200)
    let subY = titleY + 20
    for (const line of subLines) {
      ctx.fillText(line, cx, subY)
      subY += 44
    }
  }

  // Date.
  const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  ctx.fillStyle = '#64748b'
  ctx.font = '500 30px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillText(dateStr, cx, h - 110)

  // FitLog wordmark, small, bottom.
  const markSize = 56
  drawLogoMark(ctx, cx - 90, h - 56, markSize)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#f8fafc'
  ctx.font = '700 40px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillText('FitLog', cx - 90 + markSize / 2 + 16, h - 56 + 14)
}

function drawLetterSpaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1)
  let x = cx - total / 2
  const prevAlign = ctx.textAlign
  ctx.textAlign = 'left'
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, y)
    x += widths[i] + spacing
  }
  ctx.textAlign = prevAlign
}

async function renderShareCardBlob(data: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  drawShareCard(ctx, data)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  )
}

async function shareOrDownload(blob: Blob, type: ShareCardType, data: ShareCardData) {
  const filename = `fitlog-${type}-${Date.now()}.png`
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean }
  if (typeof nav.share === 'function' && typeof nav.canShare === 'function') {
    const file = new File([blob], filename, { type: 'image/png' })
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: 'FitLog', text: `${data.title}: ${data.value}` })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // fall through to download on any other share failure
      }
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Small icon button that, when clicked, rasterizes `data` into a shareable PNG (via canvas -
 * see `drawShareCard`) and shows a preview with a Share/Download action. Drop this next to any
 * unlocked milestone in AchievementsTab.
 */
export function ShareCardButton({ data, className }: { data: ShareCardData; className?: string }) {
  const [busy, setBusy] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState(false)

  async function open() {
    setBusy(true)
    setError(false)
    try {
      const b = await renderShareCardBlob(data)
      if (!b) {
        setError(true)
        return
      }
      setBlob(b)
      setPreviewUrl(URL.createObjectURL(b))
    } finally {
      setBusy(false)
    }
  }

  function close() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setBlob(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        aria-label={`Share ${data.title}`}
        title={`Share ${data.title}`}
        className={
          className ??
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-emerald-400 disabled:opacity-50'
        }
      >
        <ShareIcon />
      </button>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Share card preview"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5"
          >
            <img src={previewUrl} alt={`${data.title} share card`} className="w-full rounded-2xl" style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }} />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => blob && shareOrDownload(blob, data.type, data)}
                className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-on-accent transition hover:brightness-90"
              >
                Share / Save image
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <span role="alert" className="sr-only">
          Could not generate the share image.
        </span>
      )}
    </>
  )
}
