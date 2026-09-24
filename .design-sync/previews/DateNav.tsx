import { useState } from 'react'
import { DateNav } from 'fitlog-design-system'

// The day switcher at the top of Workouts and Meals. `max` (usually today) disables the next arrow.
export const Today = () => {
  const [date, setDate] = useState('2026-09-24')
  return (
    <div className="w-80">
      <DateNav date={date} onChange={setDate} max="2026-09-24" />
    </div>
  )
}

export const PastDay = () => {
  const [date, setDate] = useState('2026-09-19')
  return (
    <div className="w-80">
      <DateNav date={date} onChange={setDate} max="2026-09-24" />
    </div>
  )
}
