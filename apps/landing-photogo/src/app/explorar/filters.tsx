'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Camera } from 'lucide-react'

type Props = {
  categories: string[]
  currentCategory: string
  currentSort: string
}

export function ExploreFilters({ categories, currentCategory, currentSort }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  const setFilter = useCallback((category: string) => {
    const next = new URLSearchParams(params.toString())
    if (category === 'Todos') next.delete('category')
    else next.set('category', category)
    router.push(`/explorar?${next.toString()}`)
  }, [params, router])

  const setSort = useCallback((sort: string) => {
    const next = new URLSearchParams(params.toString())
    if (sort === 'recent') next.delete('sort')
    else next.set('sort', sort)
    router.push(`/explorar?${next.toString()}`)
  }, [params, router])

  const sorts = [
    { id: 'recent', label: 'Recentes' },
    { id: 'price_asc', label: 'Menor preço' },
    { id: 'price_desc', label: 'Maior preço' },
  ]

  return (
    <div className="space-y-4">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-all duration-300 ${
              currentCategory === cat
                ? 'bg-ink-900 text-paper-50 shadow-lg scale-105 dark:bg-paper-50 dark:text-ink-900'
                : 'bg-paper-100 text-ink-600 hover:bg-paper-200 dark:bg-ink-800 dark:text-paper-200 dark:hover:bg-ink-700'
            }`}
          >
            {cat === 'Todos' && <Camera className="h-3.5 w-3.5" />}
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-500">Ordenar por:</span>
        {sorts.map((s) => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className={`rounded-lg px-3 py-1 transition ${
              currentSort === s.id
                ? 'bg-sunset-500/10 text-sunset-500 font-medium'
                : 'text-ink-500 hover:text-ink-900 dark:hover:text-paper-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
