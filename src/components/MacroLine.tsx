import type { MacroTotals } from '../types'

export function MacroLine({
  macros,
  className = 'text-xs',
  as: Tag = 'p',
}: {
  macros: MacroTotals
  className?: string
  /** 'span' when it sits inside a button or another inline element. */
  as?: 'p' | 'span'
}) {
  return (
    <Tag className={`${className} text-slate-500`}>
      <span className="text-protein">P {Math.round(macros.protein)}g</span>
      <span className="mx-1 text-slate-600">·</span>
      <span className="text-carbs">C {Math.round(macros.carbs)}g</span>
      <span className="mx-1 text-slate-600">·</span>
      <span className="text-fat">F {Math.round(macros.fat)}g</span>
    </Tag>
  )
}
