import type { MacroTotals } from '../types'

export function MacroLine({ macros, className = 'text-xs' }: { macros: MacroTotals; className?: string }) {
  return (
    <p className={`${className} text-slate-500`}>
      <span className="text-protein">P {Math.round(macros.protein)}g</span>
      <span className="mx-1 text-slate-600">·</span>
      <span className="text-carbs">C {Math.round(macros.carbs)}g</span>
      <span className="mx-1 text-slate-600">·</span>
      <span className="text-fat">F {Math.round(macros.fat)}g</span>
    </p>
  )
}
