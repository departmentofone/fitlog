import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { useCreateFood } from '../../hooks/useFoods'
import { useBarcodeLookup, type OpenFoodFactsProduct } from '../../hooks/useOpenFoodFacts'

// `BarcodeDetector` isn't in TypeScript's DOM lib yet and most browsers don't
// implement it — this just gives us types for the feature-detected happy path.
declare global {
  interface BarcodeDetectorOptions {
    formats?: string[]
  }
  interface DetectedBarcode {
    rawValue: string
  }
  class BarcodeDetector {
    constructor(options?: BarcodeDetectorOptions)
    detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
  }
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector
  }
}

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

interface ReviewForm {
  name: string
  calories: string
  protein: string
  carbs: string
  fat: string
}

const EMPTY_FORM: ReviewForm = { name: '', calories: '', protein: '', carbs: '', fat: '' }

function productToForm(product: OpenFoodFactsProduct): ReviewForm {
  return {
    name: product.name,
    calories: product.caloriesPer100g != null ? String(product.caloriesPer100g) : '',
    protein: product.proteinPer100g != null ? String(product.proteinPer100g) : '',
    carbs: product.carbsPer100g != null ? String(product.carbsPer100g) : '',
    fat: product.fatPer100g != null ? String(product.fatPer100g) : '',
  }
}

/** Drives camera access + live barcode detection. Fails safe: any error here just surfaces a message. */
function useBarcodeCameraScanner(onDetected: (code: string) => void) {
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const onDetectedRef = useRef(onDetected)
  useEffect(() => {
    onDetectedRef.current = onDetected
  })

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScanning(false)
  }, [])

  // Always release the camera on unmount, no matter how scanning ended.
  useEffect(() => stop, [stop])

  const start = useCallback(async () => {
    setCameraError(null)
    if (!supported || !window.BarcodeDetector) {
      setCameraError('Barcode scanning is not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)

      const detector = new window.BarcodeDetector({ formats: BARCODE_FORMATS })
      const tick = () => {
        const video = videoRef.current
        if (!video || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        detector
          .detect(video)
          .then((codes) => {
            if (codes.length > 0) {
              onDetectedRef.current(codes[0].rawValue)
              stop()
            } else {
              rafRef.current = requestAnimationFrame(tick)
            }
          })
          .catch(() => {
            // Transient per-frame detection failure — keep trying.
            rafRef.current = requestAnimationFrame(tick)
          })
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setCameraError('Could not access the camera — you can still enter the barcode manually below.')
      setScanning(false)
    }
  }, [stop, supported])

  // Attach the stream once the <video> element exists (it only renders once `scanning` is true).
  useEffect(() => {
    if (scanning && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [scanning])

  return { supported, scanning, cameraError, videoRef, start, stop }
}

export function ScannerTab() {
  const { show } = useToast()
  const createFood = useCreateFood()
  const lookup = useBarcodeLookup()

  const [barcode, setBarcode] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM)

  const handleLookup = useCallback(
    async (code: string) => {
      const trimmed = code.trim()
      if (!trimmed) return
      const product = await lookup.mutateAsync(trimmed)
      if (product) {
        setForm(productToForm(product))
        setNotFound(false)
      } else {
        setForm(EMPTY_FORM)
        setNotFound(true)
      }
      setReviewing(true)
    },
    [lookup],
  )

  const camera = useBarcodeCameraScanner((code) => {
    setBarcode(code)
    void handleLookup(code)
  })

  // Ask for camera access as soon as the tab opens rather than waiting for an extra tap - one
  // less step for the common case. The permission prompt is still the browser's own, and typing
  // a barcode manually keeps working exactly the same if it's denied or unsupported.
  useEffect(() => {
    void camera.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function reset() {
    setBarcode('')
    setReviewing(false)
    setNotFound(false)
    setForm(EMPTY_FORM)
    lookup.reset()
  }

  function updateField(field: keyof ReviewForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.calories) return
    try {
      const trimmedBarcode = barcode.trim()
      await createFood.mutateAsync({
        name: form.name.trim(),
        caloriesPer100g: parseFloat(form.calories) || 0,
        proteinPer100g: parseFloat(form.protein) || 0,
        carbsPer100g: parseFloat(form.carbs) || 0,
        fatPer100g: parseFloat(form.fat) || 0,
        commonServings: [],
        // Only set when a barcode was actually scanned/entered, so "skip lookup, enter
        // manually" saves keep working exactly as before - see CreateFoodInput.barcode.
        ...(trimmedBarcode ? { barcode: trimmedBarcode } : {}),
      })
      show('Added to your food library')
      reset()
    } catch {
      show('Could not save this food. Please try again.', { tone: 'error' })
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-[var(--glow-shadow)] ring-1 ring-white/5">
        <h3 className="mb-1 font-medium text-white">Barcode scanner</h3>
        <p className="mb-3 text-sm text-slate-400">
          Look up a packaged food by its barcode against the Open Food Facts database, review the nutrition
          numbers, and save it to your food library.
        </p>

        <div className="flex gap-2">
          <input
            inputMode="numeric"
            placeholder="Barcode number"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleLookup(barcode)
            }}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => void handleLookup(barcode)}
            disabled={!barcode.trim() || lookup.isPending}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {lookup.isPending ? 'Looking up…' : 'Look up'}
          </button>
        </div>

        {camera.supported && (
          <div className="mt-2.5">
            {!camera.scanning ? (
              <button
                onClick={() => void camera.start()}
                className="w-full rounded-xl border border-dashed border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
              >
                Scan with camera
              </button>
            ) : (
              <div>
                <video ref={camera.videoRef} autoPlay muted playsInline className="w-full rounded-xl bg-black" />
                <button
                  onClick={camera.stop}
                  className="mt-2 w-full rounded-xl bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Cancel scan
                </button>
              </div>
            )}
          </div>
        )}

        {camera.cameraError && <p className="mt-2 text-xs text-red-400">{camera.cameraError}</p>}

        {!reviewing && (
          <button
            onClick={() => {
              setForm(EMPTY_FORM)
              setNotFound(false)
              setReviewing(true)
            }}
            className="mt-2.5 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            Skip lookup — enter details manually
          </button>
        )}
      </div>

      {reviewing && (
        <div className="rounded-3xl bg-slate-900 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-white">Review</h3>
            <button onClick={reset} className="text-sm text-slate-400 hover:text-slate-200">
              Cancel
            </button>
          </div>

          {notFound && (
            <p className="mb-3 text-sm text-amber-400">
              No match for that barcode on Open Food Facts — enter the details manually below.
            </p>
          )}

          <div className="space-y-2.5">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500">Per 100g:</p>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                placeholder="Calories"
                type="number"
                inputMode="decimal"
                value={form.calories}
                onChange={(e) => updateField('calories', e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder="Protein (g)"
                type="number"
                inputMode="decimal"
                value={form.protein}
                onChange={(e) => updateField('protein', e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder="Carbs (g)"
                type="number"
                inputMode="decimal"
                value={form.carbs}
                onChange={(e) => updateField('carbs', e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <input
                placeholder="Fat (g)"
                type="number"
                inputMode="decimal"
                value={form.fat}
                onChange={(e) => updateField('fat', e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => void handleSave()}
              disabled={!form.name.trim() || !form.calories || createFood.isPending}
              className="w-full rounded-xl bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {createFood.isPending ? 'Saving…' : 'Save to food library'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
