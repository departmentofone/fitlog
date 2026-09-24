import { useState } from 'react'
import { Toggle } from 'fitlog-design-system'

// A settings row as FitLog's Settings screen lays it out: title + hint on the left, switch on the right.
function Row({ title, hint, initial }: { title: string; hint: string; initial: boolean }) {
  const [on, setOn] = useState(initial)
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <Toggle label={title} checked={on} onChange={setOn} />
    </div>
  )
}

export const SettingsRows = () => (
  <div className="w-80 divide-y divide-white/5 rounded-3xl border-t border-white/10 bg-slate-900 px-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
    <Row title="Haptics" hint="Small vibrations for sets, PRs and streaks" initial />
    <Row title="Ask about preworkout" hint="Once a day, when you start a workout" initial={false} />
  </div>
)

export const OnAndOff = () => (
  <div className="flex items-center gap-4">
    <Toggle label="On" checked onChange={() => {}} />
    <Toggle label="Off" checked={false} onChange={() => {}} />
  </div>
)
