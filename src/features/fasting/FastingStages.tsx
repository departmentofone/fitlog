import { useState } from 'react'

interface FastingStage {
  id: string
  hours: number
  title: string
  summary: string
  detail: string
}

const STAGES: FastingStage[] = [
  {
    id: 'digesting',
    hours: 0,
    title: '0-4h · Digesting',
    summary: 'Your body is still digesting your last meal and using the glucose from it for energy.',
    detail:
      'In the first few hours after eating, insulin is elevated and your body preferentially burns the glucose from the meal you just had. Digestion and nutrient absorption are still winding down during this window, so nothing metabolically unusual is happening yet.',
  },
  {
    id: 'glycogen',
    hours: 4,
    title: '4-12h · Using stored glycogen',
    summary: 'Once digestion finishes, insulin drops and the body starts drawing on stored liver glycogen to keep blood sugar steady.',
    detail:
"Once the meal is fully absorbed, blood insulin levels fall and the liver begins releasing stored glycogen - a stored form of glucose - to maintain blood sugar. This is the ordinary overnight state most people are already in by the time they wake up, even without deliberately fasting.",
  },
  {
    id: 'switch',
    hours: 12,
    title: '12-18h · Metabolic switch begins',
    summary: 'Liver glycogen starts running low, so the body increasingly turns to breaking down fat for energy, and ketone production starts to rise.',
    detail:
"As glycogen reserves become depleted, the body gradually shifts toward burning more fatty acids and starts producing more ketone bodies in the liver. This transition is often called the metabolic switch, but it's a gradual process rather than a hard cutover, and the exact timing varies quite a bit from person to person.",
  },
  {
    id: 'ketosis',
    hours: 18,
    title: '18-24h · Fat-burning established',
    summary: "By this point, most people's liver glycogen is largely depleted and fat-burning is well underway as the main energy source.",
    detail:
      'With glycogen stores mostly exhausted, fat oxidation and ketone production continue to climb, providing an alternative fuel source for the brain and body. Individual timing still depends on things like recent diet, activity level, and body composition, so treat these hour ranges as rough, not exact.',
  },
  {
    id: 'autophagy',
    hours: 24,
    title: '24h+ · Cellular cleanup increases',
    summary: "Around the one-day mark, cellular 'cleanup' processes known as autophagy are thought to become more active.",
    detail:
      'Autophagy is a process where cells break down and recycle damaged internal components. Research - much of it in animal models, with more limited human data - suggests fasting can increase autophagy, but the precise human timeline and magnitude are still an active area of study rather than settled fact.',
  },
  {
    id: 'extended',
    hours: 48,
    title: '48h+ · Extended fasting',
    summary: 'In multi-day fasts, growth hormone levels can rise notably and the body continues to rely heavily on fat stores.',
    detail:
      'Some studies show growth hormone secretion increasing substantially during multi-day fasts, which may help the body preserve lean tissue while it draws on fat reserves. Fasts this long put more strain on the body and are generally approached with more caution - this section is general background, not medical advice.',
  },
]

function activeStageId(elapsedHours: number | null | undefined): string | null {
  if (elapsedHours == null) return null
  let current: FastingStage | null = null
  for (const stage of STAGES) {
    if (elapsedHours >= stage.hours) current = stage
  }
  return current?.id ?? null
}

/** Reference card explaining what's happening physiologically at different points in a fast. */
export function FastingStages({ elapsedHours }: { elapsedHours?: number | null }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const activeId = activeStageId(elapsedHours)
  // Collapsed by default: during a fast show just the stage you're in; otherwise only the heading.
  const visible = showAll ? STAGES : STAGES.filter((s) => s.id === activeId)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">What's happening during a fast</p>
        <button
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="-my-2 -mr-2 min-h-11 shrink-0 px-2 text-xs font-medium text-emerald-400"
        >
          {showAll ? 'Hide stages' : `All ${STAGES.length} stages`}
        </button>
      </div>
      <div className={`space-y-1.5 ${visible.length > 0 ? 'mt-2' : ''}`}>
        {visible.map((stage) => {
          const isOpen = expandedId === stage.id
          const isActive = stage.id === activeId
          return (
            <div key={stage.id} className={`rounded-xl px-3 py-2 ${isActive ? 'bg-emerald-600/10 ring-1 ring-emerald-500/30' : 'bg-slate-800/60'}`}>
              <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
                {stage.title}
                {isActive && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">Now</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{stage.summary}</p>
              {isOpen && <p className="mt-2 text-xs leading-relaxed text-slate-500">{stage.detail}</p>}
              <button
                onClick={() => setExpandedId(isOpen ? null : stage.id)}
                className="mt-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                {isOpen ? 'Show less' : 'Learn more'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
