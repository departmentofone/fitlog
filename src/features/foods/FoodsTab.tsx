import { useMemo, useState } from 'react'
import { normalizeFoodText, rankFoods } from '../../lib/foodSearch'
import { useFoodLabels } from '../../hooks/useFoodLabels'
import { useFoodLibrary } from '../../hooks/useFoods'
import { useUpdateSettings, useUserSettings } from '../../hooks/useUserSettings'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonRow } from '../../components/Skeleton'
import { NewFoodForm } from '../meals/NewFoodForm'
import { FoodRow } from './FoodRow'
import { PresetsManagerView } from './PresetsManagerView'

const PACK_LABELS: Record<string, string> = { serbia: 'Serbian products' }

function packLabel(pack: string): string {
  return PACK_LABELS[pack] ?? pack
}

/**
 * Full food-library management: search everything this account can see (own foods, the shared
 * default library, and any packs), edit or delete your own entries, label anything for your own
 * organization, turn regional packs on/off, and add a food straight into a preset. Meal logging
 * (FoodPicker) stays focused on searching and adding - this is where the library itself gets curated.
 */
export function FoodsTab() {
  const [view, setView] = useState<'library' | 'presets'>('library')
  const [search, setSearch] = useState('')
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const library = useFoodLibrary()
  const { byFood, allLabels } = useFoodLabels()

  const enabledPacks = settings?.enabled_food_packs ?? []
  const availablePacks = useMemo(() => Array.from(new Set((library.data ?? []).map((f) => f.pack).filter((p): p is string => !!p))), [library.data])

  const filtered = useMemo(() => {
    if (!library.data) return []
    let list = library.data
    if (activeLabel) list = list.filter((f) => byFood.get(f.id)?.includes(activeLabel))
    return rankFoods(list, search, 300)
  }, [library.data, search, activeLabel, byFood])

  if (view === 'presets') {
    return (
      <div className="space-y-4 p-4">
        <div className="flex rounded-full bg-slate-900 p-1 ring-1 ring-white/5">
          <TabButton active={false} onClick={() => setView('library')}>
            Library
          </TabButton>
          <TabButton active onClick={() => setView('presets')}>
            Presets
          </TabButton>
        </div>
        <PresetsManagerView />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex rounded-full bg-slate-900 p-1 ring-1 ring-white/5">
        <TabButton active onClick={() => setView('library')}>
          Library
        </TabButton>
        <TabButton active={false} onClick={() => setView('presets')}>
          Presets
        </TabButton>
      </div>

      {availablePacks.length > 0 && (
        <div className="space-y-2">
          {availablePacks.map((pack) => {
            const on = enabledPacks.includes(pack)
            const count = (library.data ?? []).filter((f) => f.pack === pack).length
            return (
              <div key={pack} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900 border-t border-white/10 p-3 ring-1 ring-white/5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{packLabel(pack)} pack</p>
                  <p className="text-xs text-slate-500">{count} branded/regional foods, off by default</p>
                </div>
                <button
                  onClick={() => {
                    const next = on ? enabledPacks.filter((p) => p !== pack) : [...enabledPacks, pack]
                    updateSettings.mutate({ enabled_food_packs: next })
                  }}
                  aria-pressed={on}
                  className={`shrink-0 min-h-8 rounded-full px-3.5 text-xs font-semibold transition ${
                    on ? 'bg-emerald-600 text-on-accent' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {on ? 'On' : 'Off'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search foods…"
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
      />

      {allLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allLabels.map((l) => (
            <button
              key={l}
              onClick={() => setActiveLabel(activeLabel === l ? null : l)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                activeLabel === l ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {creating ? (
        <NewFoodForm onSaved={() => setCreating(false)} onCancel={() => setCreating(false)} />
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300 active:border-emerald-500 active:text-emerald-400"
        >
          + New food
        </button>
      )}

      {library.isLoading && (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {!library.isLoading && filtered.length === 0 && (
        <EmptyState
          variant="list"
          message={
            normalizeFoodText(search)
              ? `No foods match "${search.trim()}".`
              : 'No foods to show — add one above.'
          }
        />
      )}
      <div className="space-y-2">
        {filtered.map((food) => (
          <FoodRow key={food.id} food={food} labels={byFood.get(food.id) ?? []} />
        ))}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 flex-1 rounded-full text-sm font-semibold transition ${
        active ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}
