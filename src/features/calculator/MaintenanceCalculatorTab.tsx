import { useState } from 'react'
import { MaintenanceCalculator } from './MaintenanceCalculator'
import { PlateCalculator } from './PlateCalculator'

type CalculatorMode = 'maintenance' | 'plates'

const MODE_OPTIONS: { value: CalculatorMode; label: string }[] = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'plates', label: 'Plates' },
]

export function MaintenanceCalculatorTab() {
  const [mode, setMode] = useState<CalculatorMode>('maintenance')

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-1.5">
        {MODE_OPTIONS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`rounded-xl px-2 py-1.5 text-xs font-medium transition ${
              mode === m.value ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'maintenance' ? <MaintenanceCalculator /> : <PlateCalculator />}
    </div>
  )
}
