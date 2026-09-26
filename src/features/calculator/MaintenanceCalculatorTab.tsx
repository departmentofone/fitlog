import { MaintenanceCalculator } from './MaintenanceCalculator'
import { PlateCalculator } from './PlateCalculator'

/**
 * The two calculators are separate pages, each opened from where it's needed: calories from Diet,
 * plates from the workout log. (They used to share a Calculator tab in the menu, where the plate
 * calculator was easy to miss.) Both render two cards as a fragment.
 */
export function MaintenanceCalculatorTab() {
  return (
    <div className="space-y-4 p-4">
      <MaintenanceCalculator />
    </div>
  )
}

export function PlateCalculatorTab() {
  return (
    <div className="space-y-4 p-4">
      <PlateCalculator />
    </div>
  )
}
