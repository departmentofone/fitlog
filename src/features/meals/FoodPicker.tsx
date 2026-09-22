import { useState } from 'react'
import { consumeSharedText } from '../../lib/shareTarget'
import type { Food } from '../../types'
import { FoodAmountForm } from './FoodAmountForm'
import { FoodSearchPanel } from './FoodSearchPanel'
import { NewFoodForm } from './NewFoodForm'

interface FoodPickerProps {
  onAdd: (input: { foodId: string; grams: number; servingLabel: string | null }) => void
  onCancel: () => void
}

export function FoodPicker({ onAdd, onCancel }: FoodPickerProps) {
  // Something shared in from another app (App.tsx's share_target handling) prefills search the
  // first time a picker opens after that, then it's consumed - it won't reappear on a later add.
  const [search, setSearch] = useState(() => consumeSharedText() ?? '')
  const [selected, setSelected] = useState<Food | null>(null)
  const [creating, setCreating] = useState(false)

  if (creating) {
    return (
      <NewFoodForm
        onSaved={(food) => {
          // Leave the form and go straight to choosing an amount for the new food.
          setCreating(false)
          setSelected(food)
        }}
        onCancel={() => setCreating(false)}
      />
    )
  }

  if (selected) {
    return <FoodAmountForm food={selected} onAdd={onAdd} onBack={() => setSelected(null)} />
  }

  return (
    <FoodSearchPanel
      search={search}
      onSearchChange={setSearch}
      onSelectFood={setSelected}
      onCreateNew={() => setCreating(true)}
      onCancel={onCancel}
    />
  )
}
