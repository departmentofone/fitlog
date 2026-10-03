import { useState } from 'react'
import { FireStreak } from '../../components/FireStreak'

/** Short, practical recovery habits; one a day, picked by the date so it stays put until tomorrow. */
const TIPS: { title: string; text: string }[] = [
  { title: 'Sleep is where the work pays off', text: 'Aim for 7 to 9 hours tonight. Most of the repair from training happens while you sleep.' },
  { title: 'Take an easy walk', text: '20 to 30 minutes at a relaxed pace gets blood moving through sore muscles without adding fatigue.' },
  { title: 'Keep protein up', text: 'Muscle rebuilds over the day or two after training, so rest days need protein as much as training days.' },
  { title: 'Drink steadily', text: 'Even mild dehydration can make you feel stiffer and more tired. Keep a bottle within reach.' },
  { title: 'Ten minutes of mobility', text: 'Gentle stretching for the muscles you trained keeps them moving well for next time.' },
  { title: 'Magnesium from food', text: 'Pumpkin seeds, almonds, spinach and beans are easy ways to get more of it, and it plays a part in muscle and sleep.' },
  { title: 'Eat to your usual target', text: "Cutting food hard on rest days slows recovery. Your body is using today's meals to rebuild." },
  { title: 'Earlier last coffee', text: 'Caffeine lingers for hours. Having the last cup before early afternoon makes sleep easier tonight.' },
  { title: 'Know your soreness', text: "Dull soreness a day or two after a hard session is normal. Sharp or joint pain isn't, and is a reason to rest it longer." },
  { title: 'Plan the next session', text: "Look at your next workout now, so tomorrow starts with a plan instead of a decision." },
  { title: 'Keep it conversational', text: 'If you want to move, a bike ride or a swim is fine at a pace where you could still hold a conversation.' },
  { title: 'Get some daylight', text: 'Time outside in the morning helps set your body clock, which makes it easier to fall asleep at night.' },
]

/** The same tip all day for a given date, a different one tomorrow. */
function tipIndexFor(date: string): number {
  let hash = 0
  for (const ch of date) hash = (hash * 31 + ch.charCodeAt(0)) % 9973
  return hash % TIPS.length
}

/**
 * Shown on a day logged as a rest day: what happened (it counted, the streak goes on) and one
 * small recovery habit for the day. Undoing it is a quiet link, since logging a workout after all
 * is the exception.
 */
export function RestDayCard({
  date,
  streak,
  onUndo,
  undoing,
}: {
  date: string
  streak: number
  onUndo: () => void
  undoing?: boolean
}) {
  const [offset, setOffset] = useState(0)
  const tip = TIPS[(tipIndexFor(date) + offset) % TIPS.length]

  return (
    <div role="status" className="pop-in card p-5">
      <div className="flex items-start gap-3.5">
        <span className="area-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-400">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Rest day</h2>
            <FireStreak count={streak} label="day streak" />
          </div>
          <p className="mt-0.5 text-sm text-slate-400">Logged. Recovery is part of training, and it keeps your streak going.</p>
        </div>
      </div>

      <div className="inset mt-5 p-4">
        <h3 className="text-[15px] font-semibold text-white">{tip.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{tip.text}</p>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="-mb-2 -ml-1 mt-1 min-h-11 px-1 text-xs font-medium text-emerald-400"
        >
          Another tip
        </button>
      </div>

      <div className="mt-2 flex justify-center">
        <button onClick={onUndo} disabled={undoing} className="min-h-11 px-3 text-sm font-medium text-slate-400 disabled:opacity-50">
          {undoing ? 'Undoing…' : 'Train today after all'}
        </button>
      </div>
    </div>
  )
}
