import type { ReactNode } from 'react'
import type { MuscleGroup } from '../types'

/**
 * Anatomical front/back body map (the style Hevy and Fitbod use): a flat muscle illustration where
 * each muscle is its own region, filled by how much it was trained. Replaces the earlier
 * rectangles-and-circles diagram.
 *
 * Paths are drawn for the figure's left half on a 200x440 canvas (centre line x=100) and mirrored
 * for the right half, so both sides always match.
 */

type Region = 'front' | 'back'

interface MusclePath {
  /** The specific muscle this shape is. */
  group: MuscleGroup
  view: Region
  d: string
}

/** Parent groups light up every specific muscle they cover. */
const PARENT_OF: Partial<Record<MuscleGroup, MuscleGroup>> = {
  upper_chest: 'chest',
  lower_chest: 'chest',
  traps: 'back',
  lats: 'back',
  lower_back: 'back',
  front_delts: 'shoulders',
  side_delts: 'shoulders',
  rear_delts: 'shoulders',
}

/** Left half of the body outline, drawn under the muscles; gaps between muscles show it as definition lines. */
const SILHOUETTE =
  'M100 58 C95 58 92 61 90 64 C80 68 68 71 60 75 C49 79 42 89 41 102 C39 116 38 130 39 146 C34 162 31 180 31 194 C30 203 32 213 38 215 C44 215 46 206 47 196 C50 181 54 166 58 152 C61 139 63 127 65 117 C67 132 69 150 69 168 C66 180 62 196 60 214 C58 240 60 266 64 292 C66 305 64 316 62 330 C60 350 60 372 64 392 C66 402 64 412 68 422 C72 430 82 430 84 422 C86 410 84 400 84 390 C88 370 90 348 88 326 C88 314 87 305 90 296 C94 276 96 256 97 236 L100 226 Z'

const MUSCLES: MusclePath[] = [
  // ---------- front ----------
  { view: 'front', group: 'traps', d: 'M93 64 C86 67 77 71 67 76 L74 81 C82 78 90 75 96 71 Z' },
  { view: 'front', group: 'side_delts', d: 'M61 77 C51 78 44 86 43 98 C44 102 46 104 48 103 C48 93 53 85 62 80 Z' },
  { view: 'front', group: 'front_delts', d: 'M64 78 C56 81 50 90 49 101 C51 106 55 107 58 104 C61 96 66 90 72 86 C70 82 68 79 64 78 Z' },
  { view: 'front', group: 'upper_chest', d: 'M73 86 C81 81 90 80 98 82 L98 97 C89 96 80 97 71 100 C67 96 68 90 73 86 Z' },
  { view: 'front', group: 'lower_chest', d: 'M71 102 C80 99 89 98 98 99 L98 115 C90 120 81 121 75 117 C70 113 68 107 71 102 Z' },
  { view: 'front', group: 'biceps', d: 'M50 108 C45 118 43 131 44 143 C47 149 52 149 55 143 C58 131 59 120 57 109 C55 105 52 105 50 108 Z' },
  { view: 'front', group: 'forearms', d: 'M44 150 C39 164 36 179 36 193 C39 197 43 197 45 193 C48 180 52 166 54 153 C51 148 47 147 44 150 Z' },
  // abs: four stacked segments beside the centre line, plus the obliques
  { view: 'front', group: 'abs', d: 'M88 122 L98 122 L98 135 L87 135 C86 130 86 126 88 122 Z' },
  { view: 'front', group: 'abs', d: 'M87 138 L98 138 L98 151 L87 151 Z' },
  { view: 'front', group: 'abs', d: 'M87 154 L98 154 L98 167 L87 167 Z' },
  { view: 'front', group: 'abs', d: 'M87 170 L98 170 L98 190 C94 192 90 190 88 186 Z' },
  { view: 'front', group: 'abs', d: 'M75 122 C80 126 83 134 84 146 C85 160 85 172 86 186 C80 184 76 176 74 164 C72 150 72 135 75 122 Z' },
  { view: 'front', group: 'abductors', d: 'M72 190 C66 196 63 206 63 217 C66 211 71 205 77 200 Z' },
  { view: 'front', group: 'quads', d: 'M77 201 C69 214 65 236 65 258 C65 274 68 285 73 292 C79 295 85 292 88 286 C92 270 93 250 93 232 C93 218 89 207 84 201 Z' },
  { view: 'front', group: 'adductors', d: 'M95 206 C98 214 99 224 99 234 L99 252 C96 257 94 256 93 250 C93 236 93 222 95 206 Z' },
  { view: 'front', group: 'calves', d: 'M68 318 C63 332 62 350 64 368 C67 374 71 374 73 368 C76 352 76 334 74 319 Z' },
  { view: 'front', group: 'calves', d: 'M82 319 C86 334 87 352 85 369 C83 374 80 373 79 368 C78 352 78 334 80 320 Z' },

  // ---------- back ----------
  { view: 'back', group: 'traps', d: 'M100 60 C94 61 86 66 75 73 C81 79 89 86 94 96 C96 110 98 122 100 134 Z' },
  { view: 'back', group: 'side_delts', d: 'M61 77 C51 78 44 86 43 98 C44 102 46 104 48 103 C48 93 53 85 62 80 Z' },
  { view: 'back', group: 'rear_delts', d: 'M65 78 C56 81 50 90 49 101 C52 105 57 105 60 100 C63 93 68 87 74 83 C72 80 69 78 65 78 Z' },
  { view: 'back', group: 'triceps', d: 'M50 106 C45 116 43 130 44 142 C47 148 52 148 55 142 C58 130 59 118 58 107 C55 102 52 102 50 106 Z' },
  { view: 'back', group: 'forearms', d: 'M44 150 C39 164 36 179 36 193 C39 197 43 197 45 193 C48 180 52 166 54 153 C51 148 47 147 44 150 Z' },
  { view: 'back', group: 'lats', d: 'M73 96 C81 100 88 108 93 120 C95 136 93 150 87 162 C81 168 76 170 72 170 C70 156 68 140 68 124 C68 114 70 104 73 96 Z' },
  { view: 'back', group: 'lower_back', d: 'M89 165 C93 157 96 149 98 142 L98 190 C93 192 88 190 84 186 C84 178 86 171 89 165 Z' },
  { view: 'back', group: 'abductors', d: 'M72 188 C66 192 62 200 62 210 C66 204 71 200 77 198 Z' },
  { view: 'back', group: 'glutes', d: 'M98 192 C89 191 80 195 75 203 C71 213 71 225 77 232 C85 238 93 236 98 230 Z' },
  { view: 'back', group: 'hamstrings', d: 'M75 239 C69 253 67 271 69 288 C73 296 80 298 86 292 C90 276 91 258 91 243 C87 237 80 235 75 239 Z' },
  { view: 'back', group: 'adductors', d: 'M93 243 C97 251 98 263 98 275 C96 281 94 280 93 275 C93 263 93 253 93 243 Z' },
  { view: 'back', group: 'calves', d: 'M68 312 C62 326 61 344 64 360 C68 368 74 368 77 360 C79 346 79 330 77 314 Z' },
  { view: 'back', group: 'calves', d: 'M80 314 C86 324 88 340 86 356 C84 363 80 363 79 357 C79 344 79 328 80 314 Z' },
]

/** Head and hands - never highlighted. */
const DECOR = [
  'M100 12 C88 12 80 22 80 36 C80 50 88 60 100 60 Z',
  'M38 198 C33 202 32 212 36 218 C40 222 45 220 46 214 C47 207 44 199 38 198 Z',
]

export type MuscleIntensity = Partial<Record<MuscleGroup, number>>

interface MuscleDiagramProps {
  /** Muscles shown fully highlighted (a single choice, or everything worked). */
  selected?: MuscleGroup | MuscleGroup[] | null
  /** Heatmap: relative training load per muscle (e.g. sets). Scaled against the largest value. */
  intensity?: MuscleIntensity
  /** Makes each muscle tappable. */
  onSelect?: (group: MuscleGroup) => void
  /** Width of each figure in px. */
  size?: number
  /** Show the "less → more" key under a heatmap. */
  showLegend?: boolean
}

/** 0 = untrained; otherwise 0.25..1 in four visible steps so small differences still read. */
export function muscleLevel(
  group: MuscleGroup,
  selected: MuscleGroup[],
  intensity: MuscleIntensity | undefined,
  max: number,
): number {
  const parent = PARENT_OF[group]
  if (selected.includes('cardio') || selected.includes(group) || (parent && selected.includes(parent))) return 1
  if (!intensity || max <= 0) return 0
  const value = (intensity[group] ?? 0) + (parent ? intensity[parent] ?? 0 : 0)
  if (value <= 0) return 0
  return Math.max(0.25, Math.ceil((value / max) * 4) / 4)
}

function Figure({
  view,
  selected,
  intensity,
  max,
  onSelect,
  size,
}: {
  view: Region
  selected: MuscleGroup[]
  intensity?: MuscleIntensity
  max: number
  onSelect?: (group: MuscleGroup) => void
  size: number
}) {
  const muscles = MUSCLES.filter((m) => m.view === view)
  const mirrored = (content: ReactNode) => (
    <>
      {content}
      <g transform="translate(200 0) scale(-1 1)">{content}</g>
    </>
  )

  return (
    <figure className="flex flex-col items-center gap-1">
      <svg
        viewBox="28 8 144 426"
        width={size}
        height={(size * 426) / 144}
        role={onSelect ? 'group' : 'img'}
        aria-label={`${view === 'front' ? 'Front' : 'Back'} of body`}
      >
        {mirrored(
          <>
            <path d={SILHOUETTE} fill="var(--body-base)" />
            {DECOR.map((d, i) => (
              <path key={i} d={d} fill="var(--body-decor)" />
            ))}
            {muscles.map((m, i) => {
              const level = muscleLevel(m.group, selected, intensity, max)
              return (
                <path
                  key={`${m.group}-${i}`}
                  d={m.d}
                  data-muscle={m.group}
                  fill={level > 0 ? 'var(--color-emerald-400)' : 'var(--body-muscle)'}
                  fillOpacity={level > 0 ? 0.3 + level * 0.7 : 1}
                  stroke="var(--body-line)"
                  strokeWidth={0.8}
                  className={onSelect ? 'cursor-pointer active:opacity-80' : undefined}
                  onClick={onSelect ? () => onSelect(m.group) : undefined}
                >
                  <title>{m.group.replace('_', ' ')}</title>
                </path>
              )
            })}
          </>,
        )}
      </svg>
      <figcaption className="eyebrow">
        {view === 'front' ? 'Front' : 'Back'}
      </figcaption>
    </figure>
  )
}

export function MuscleDiagram({ selected, intensity, onSelect, size = 120, showLegend = false }: MuscleDiagramProps) {
  const selectedList = Array.isArray(selected) ? selected : selected ? [selected] : []
  const max = intensity ? Math.max(0, ...Object.values(intensity).map((v) => v ?? 0)) : 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex justify-center gap-4">
        <Figure view="front" selected={selectedList} intensity={intensity} max={max} onSelect={onSelect} size={size} />
        <Figure view="back" selected={selectedList} intensity={intensity} max={max} onSelect={onSelect} size={size} />
      </div>
      {showLegend && intensity && max > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500" aria-hidden="true">
          <span>Less</span>
          {[0.25, 0.5, 0.75, 1].map((l) => (
            <span key={l} className="h-2.5 w-5 rounded-sm" style={{ background: 'var(--color-emerald-400)', opacity: 0.3 + l * 0.7 }} />
          ))}
          <span>More</span>
        </div>
      )}
    </div>
  )
}
