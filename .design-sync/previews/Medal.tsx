import { Medal } from 'fitlog-design-system'

// Earned medals in each metal; the colours are fixed, whatever the accent.
export const Tiers = () => (
  <div className="flex items-end gap-4">
    <Medal tier="bronze" category="consistency" unlocked progress={1} size={56} />
    <Medal tier="silver" category="strength" unlocked progress={1} size={56} />
    <Medal tier="gold" category="nutrition" unlocked progress={1} size={56} />
    <Medal tier="platinum" category="fasting" unlocked progress={1} size={56} />
  </div>
)

// Locked medals draw progress as a ring - as in Achievements' "Almost there" list.
export const Locked = () => (
  <div className="flex items-end gap-4">
    <Medal tier="bronze" category="consistency" unlocked={false} progress={0.8} size={56} />
    <Medal tier="silver" category="strength" unlocked={false} progress={0.45} size={56} />
    <Medal tier="gold" category="fasting" unlocked={false} progress={0.1} size={56} />
  </div>
)

// A collection grid cell: medal, name, progress caption.
export const InCollection = () => (
  <div className="grid w-80 grid-cols-3 gap-3 rounded-3xl bg-slate-900 p-4 ring-1 ring-white/5">
    {[
      { name: 'Workouts', tier: 'bronze', category: 'consistency', unlocked: false, progress: 0.8, caption: '8 / 10' },
      { name: 'Training streak', tier: 'bronze', category: 'consistency', unlocked: true, progress: 1, caption: 'Bronze' },
      { name: 'Bench Press', tier: 'silver', category: 'strength', unlocked: true, progress: 1, caption: 'Silver' },
    ].map((m) => (
      <div key={m.name} className="flex flex-col items-center gap-1 text-center">
        <Medal tier={m.tier as 'bronze'} category={m.category as 'consistency'} unlocked={m.unlocked} progress={m.progress} size={48} />
        <p className={`text-xs font-semibold ${m.unlocked ? 'text-white' : 'text-slate-400'}`}>{m.name}</p>
        <p className="text-[11px] text-slate-500">{m.caption}</p>
      </div>
    ))}
  </div>
)
