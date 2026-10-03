import type { MacroTotals } from '../types'

export function MacroLine({
  macros,
  className = 'text-xs',
  as: Tag = 'p',
  proteinGoal,
}: {
  macros: MacroTotals
  className?: string
  /** Shows protein as "101 / 150g" against the daily protein goal, when there is one. */
  proteinGoal?: number | null
  /** 'span' when it sits inside a button or another inline element. */
  as?: 'p' | 'span'
}) {
  return (
    <Tag className={`${className} text-slate-500`}>
      <span className="text-protein">
        P {Math.round(macros.protein)}
        {proteinGoal ? ` / ${Math.round(proteinGoal)}` : ''}g
      </span>
      <span className="mx-1 text-slate-600">·</span>
      <span className="text-carbs">C {Math.round(macros.carbs)}g</span>
      <span className="mx-1 text-slate-600">·</span>
      <span className="text-fat">F {Math.round(macros.fat)}g</span>
    </Tag>
  )
}
