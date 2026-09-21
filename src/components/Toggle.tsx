/** iOS/Android-style on/off switch for settings rows (a checkbox reads as a form field, not a setting). */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  /** Accessible name, usually the row's title. */
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-700'}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-[#fff] shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  )
}
