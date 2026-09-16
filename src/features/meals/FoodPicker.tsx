import { useState } from 'react'
import type { Food } from '../../types'
import { FoodAmountForm } from './FoodAmountForm'
import { FoodSearchPanel } from './FoodSearchPanel'
import { NewFoodForm } from './NewFoodForm'

interface FoodPickerProps {
  onAdd: (input: { foodId: string; grams: number; servingLabel: string | null }) => void
  onCancel: () => void
}

export function FoodPicker({ onAdd, onCancel }: FoodPickerProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const [creating, setCreating] = useState(false)

  if (creating) {
    return <NewFoodForm onCreated={(food) => setSelected(food)} onCancel={() => setCreating(false)} />
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
