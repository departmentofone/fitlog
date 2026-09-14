import type { MuscleGroup } from '../types'

/** Subgroups reuse their parent region's artwork - no new shapes needed to highlight correctly. */
const SUBGROUPS: Partial<Record<MuscleGroup, MuscleGroup>> = {
  lats: 'back',
  traps: 'back',
  lower_back: 'back',
  front_delts: 'shoulders',
  side_delts: 'shoulders',
  rear_delts: 'shoulders',
  upper_chest: 'chest',
  lower_chest: 'chest',
}

type Shape =
  | { shape: 'rect'; x: number; y: number; width: number; height: number; rx: number }
  | { shape: 'circle'; cx: number; cy: number; r: number }

interface Region {
  group: MuscleGroup
  view: 'front' | 'back'
  label: string
  shapes: Shape[]
}

const REGIONS: Region[] = [
  {
    group: 'shoulders',
    view: 'front',
    label: 'Shoulders',
    shapes: [
      { shape: 'circle', cx: 38, cy: 60, r: 17 },
      { shape: 'circle', cx: 122, cy: 60, r: 17 },
    ],
  },
  {
    group: 'chest',
    view: 'front',
    label: 'Chest',
    shapes: [{ shape: 'rect', x: 44, y: 54, width: 72, height: 55, rx: 18 }],
  },
  {
    group: 'biceps',
    view: 'front',
    label: 'Biceps',
    shapes: [
      { shape: 'rect', x: 20, y: 75, width: 20, height: 45, rx: 10 },
      { shape: 'rect', x: 120, y: 75, width: 20, height: 45, rx: 10 },
    ],
  },
  {
    group: 'forearms',
    view: 'front',
    label: 'Forearms',
    shapes: [
      { shape: 'rect', x: 14, y: 122, width: 18, height: 50, rx: 9 },
      { shape: 'rect', x: 128, y: 122, width: 18, height: 50, rx: 9 },
    ],
  },
  {
    group: 'abs',
    view: 'front',
    label: 'Abs',
    shapes: [{ shape: 'rect', x: 50, y: 108, width: 60, height: 62, rx: 14 }],
  },
  {
    group: 'quads',
    view: 'front',
    label: 'Quads',
    shapes: [
      { shape: 'rect', x: 48, y: 178, width: 28, height: 70, rx: 14 },
      { shape: 'rect', x: 84, y: 178, width: 28, height: 70, rx: 14 },
    ],
  },
  {
    group: 'calves',
    view: 'front',
    label: 'Calves',
    shapes: [
      { shape: 'rect', x: 50, y: 252, width: 22, height: 60, rx: 11 },
      { shape: 'rect', x: 88, y: 252, width: 22, height: 60, rx: 11 },
    ],
  },
  {
    group: 'adductors',
    view: 'front',
    label: 'Adductors',
    shapes: [{ shape: 'rect', x: 74, y: 182, width: 12, height: 55, rx: 6 }],
  },
  {
    group: 'shoulders',
    view: 'back',
    label: 'Shoulders',
    shapes: [
      { shape: 'circle', cx: 38, cy: 60, r: 17 },
      { shape: 'circle', cx: 122, cy: 60, r: 17 },
    ],
  },
  {
    group: 'back',
    view: 'back',
    label: 'Back',
    shapes: [
      { shape: 'rect', x: 44, y: 54, width: 72, height: 30, rx: 14 },
      { shape: 'rect', x: 48, y: 84, width: 64, height: 55, rx: 16 },
    ],
  },
  {
    group: 'triceps',
    view: 'back',
    label: 'Triceps',
    shapes: [
      { shape: 'rect', x: 20, y: 75, width: 20, height: 45, rx: 10 },
      { shape: 'rect', x: 120, y: 75, width: 20, height: 45, rx: 10 },
    ],
  },
  {
    group: 'forearms',
    view: 'back',
    label: 'Forearms',
    shapes: [
      { shape: 'rect', x: 14, y: 122, width: 18, height: 50, rx: 9 },
      { shape: 'rect', x: 128, y: 122, width: 18, height: 50, rx: 9 },
    ],
  },
  {
    group: 'glutes',
    view: 'back',
    label: 'Glutes',
    shapes: [{ shape: 'rect', x: 50, y: 160, width: 60, height: 38, rx: 16 }],
  },
  {
    group: 'hamstrings',
    view: 'back',
    label: 'Hamstrings',
    shapes: [
      { shape: 'rect', x: 48, y: 200, width: 28, height: 52, rx: 14 },
      { shape: 'rect', x: 84, y: 200, width: 28, height: 52, rx: 14 },
    ],
  },
  {
    group: 'calves',
    view: 'back',
    label: 'Calves',
    shapes: [
      { shape: 'rect', x: 50, y: 252, width: 22, height: 60, rx: 11 },
      { shape: 'rect', x: 88, y: 252, width: 22, height: 60, rx: 11 },
    ],
  },
  {
    group: 'abductors',
    view: 'back',
    label: 'Abductors',
    shapes: [
      { shape: 'rect', x: 36, y: 165, width: 12, height: 55, rx: 6 },
      { shape: 'rect', x: 112, y: 165, width: 12, height: 55, rx: 6 },
    ],
  },
]

const DECORATIONS: { view: 'front' | 'back'; shapes: Shape[] }[] = [
  {
    view: 'front',
    shapes: [
      { shape: 'circle', cx: 80, cy: 26, r: 20 },
      { shape: 'rect', x: 72, y: 44, width: 16, height: 10, rx: 3 },
      { shape: 'circle', cx: 61, cy: 320, r: 10 },
      { shape: 'circle', cx: 99, cy: 320, r: 10 },
    ],
  },
  {
    view: 'back',
    shapes: [
      { shape: 'circle', cx: 80, cy: 26, r: 20 },
      { shape: 'rect', x: 72, y: 44, width: 16, height: 10, rx: 3 },
      { shape: 'circle', cx: 61, cy: 320, r: 10 },
      { shape: 'circle', cx: 99, cy: 320, r: 10 },
    ],
  },
]

interface ShapeVisualProps {
  className: string
  onClick?: () => void
}

function renderShape(shape: Shape, props: ShapeVisualProps) {
  if (shape.shape === 'rect') {
    return (
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rx={shape.rx}
        className={props.className}
        onClick={props.onClick}
      />
    )
  }
  return <circle cx={shape.cx} cy={shape.cy} r={shape.r} className={props.className} onClick={props.onClick} />
}

interface MuscleDiagramProps {
  selected?: MuscleGroup | MuscleGroup[] | null
  onSelect?: (group: MuscleGroup) => void
  size?: number
}

function Figure({
  view,
  selected,
  onSelect,
  size,
}: {
  view: 'front' | 'back'
  selected?: MuscleGroup | MuscleGroup[] | null
  onSelect?: (group: MuscleGroup) => void
  size: number
}) {
  const regions = REGIONS.filter((r) => r.view === view)
  const decorations = DECORATIONS.find((d) => d.view === view)
  const selectedList = Array.isArray(selected) ? selected : selected ? [selected] : []

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 160 340" width={size} height={(size * 340) / 160} className="overflow-visible">
        {decorations?.shapes.map((s, i) => (
          <g key={i}>{renderShape(s, { className: 'fill-slate-300 dark:fill-slate-700' })}</g>
        ))}
        {regions.map((region) =>
          region.shapes.map((s, i) => {
            const isActive =
              selectedList.some((g) => g === region.group || SUBGROUPS[g] === region.group) || selectedList.includes('cardio')
            return (
              <g key={`${region.group}-${i}`}>
                {renderShape(s, {
                  className: [
                    'transition-colors stroke-slate-500/40',
                    isActive ? 'fill-emerald-500' : 'fill-slate-400 dark:fill-slate-600',
                    onSelect ? 'cursor-pointer hover:fill-emerald-400' : '',
                  ].join(' '),
                  onClick: onSelect ? () => onSelect(region.group) : undefined,
                })}
              </g>
            )
          }),
        )}
      </svg>
      <span className="text-xs uppercase tracking-wide text-slate-400">
        {view === 'front' ? 'Front' : 'Back'}
      </span>
    </div>
  )
}

export function MuscleDiagram({ selected, onSelect, size = 120 }: MuscleDiagramProps) {
  return (
    <div className="flex justify-center gap-6">
      <Figure view="front" selected={selected} onSelect={onSelect} size={size} />
      <Figure view="back" selected={selected} onSelect={onSelect} size={size} />
    </div>
  )
}
