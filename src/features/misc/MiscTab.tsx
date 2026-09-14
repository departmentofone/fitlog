import { AlcoholSection } from './AlcoholSection'
import { FastingSection } from './FastingSection'

export function MiscTab() {
  return (
    <div className="space-y-4 p-4">
      <FastingSection />
      <AlcoholSection />
    </div>
  )
}
