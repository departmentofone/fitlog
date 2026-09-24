import { CircularProgress } from 'fitlog-design-system'

// Tones as FitLog uses them: good = on target (the success green), neutral = in progress (blue),
// warn = over a limit (red).
export const Tones = () => (
  <div className="flex items-center gap-4">
    <CircularProgress percent={58} tone="good" label="of goal" />
    <CircularProgress percent={81} tone="neutral" />
    <CircularProgress percent={100} tone="warn" label="over" />
  </div>
)

// The Diet tab's daily calorie card: the ring sits beside the headline number.
export const InDietCard = () => (
  <div className="w-80 rounded-3xl border-t border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-300">Diet goal</p>
        <p className="mt-1 text-4xl font-bold text-white">
          2,300 <span className="text-lg font-medium text-slate-400">kcal</span>
        </p>
        <p className="text-xs text-slate-500">Deficit target</p>
        <p className="mt-2 text-sm font-medium text-emerald-400">967 kcal left today</p>
      </div>
      <CircularProgress percent={58} label="of goal" size={84} />
    </div>
  </div>
)

// The Fasting timer uses a larger ring.
export const FastingSize = () => <CircularProgress percent={81} tone="neutral" size={112} strokeWidth={10} />
