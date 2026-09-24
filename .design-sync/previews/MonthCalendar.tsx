import { useState } from 'react'
import { MonthCalendar } from 'fitlog-design-system'

// History's workout calendar: dots mark days with a workout, the selected day is outlined.
export const WorkoutHistory = () => {
  const [month, setMonth] = useState(new Date(2026, 8, 1))
  const [selected, setSelected] = useState<string | null>('2026-09-22')
  const logged = new Set(['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-08', '2026-09-10', '2026-09-12', '2026-09-15', '2026-09-17', '2026-09-19', '2026-09-22', '2026-09-24'])
  return (
    <div className="w-80 rounded-3xl bg-slate-900 p-4 ring-1 ring-white/5">
      <h3 className="mb-3 font-medium text-white">Workout history</h3>
      <MonthCalendar month={month} onMonthChange={setMonth} markedDates={logged} selectedDate={selected} onSelectDate={setSelected} maxDate="2026-09-30" />
    </div>
  )
}
