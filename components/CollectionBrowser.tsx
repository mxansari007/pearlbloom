// src/components/CollectionBrowser.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Product } from '../types/products'
import ProductCard from './ProductCard'
import { track } from '@/utils/analytics'

type Props = {
  initialProducts: Product[]
  categories?: string[]
}

export default function CollectionBrowser({ initialProducts, categories = [] }: Props) {
  const gridInitialCount = 9
  const listInitialCount = 24
  const [query, setQuery] = useState('')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const sortOptions = ['featured', 'price-asc', 'price-desc', 'newest'] as const
  type SortOption = typeof sortOptions[number]
  const [sort, setSort] = useState<SortOption>('newest')
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [visibleCount, setVisibleCount] = useState(gridInitialCount) // show 9 initially for balanced grid

  const priceBounds = useMemo(() => {
    const prices = initialProducts
      .map((p) => p.price)
      .filter((p): p is number => typeof p === 'number' && p > 0)
    const min = prices.length ? Math.min(...prices) : 0
    const max = prices.length ? Math.max(...prices) : 0
    return { min, max }
  }, [initialProducts])

  const sliderDisabled = priceBounds.max <= priceBounds.min
  const selectedMin = minPrice === '' ? priceBounds.min : minPrice
  const selectedMax = maxPrice === '' ? priceBounds.max : maxPrice
  const range = Math.max(0, priceBounds.max - priceBounds.min)
  const step =
    range <= 0 ? 1 : range <= 1000 ? 10 : range <= 5000 ? 25 : range <= 20000 ? 50 : 100

  const minPercent = range ? ((selectedMin - priceBounds.min) / range) * 100 : 0
  const maxPercent = range ? ((selectedMax - priceBounds.min) / range) * 100 : 100
  const minPercentClamped = Math.max(0, Math.min(100, minPercent))
  const maxPercentClamped = Math.max(0, Math.min(100, maxPercent))
  const splitPercentClamped = Math.max(0, Math.min(100, (minPercentClamped + maxPercentClamped) / 2))

  function formatINR(value: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  function setMinFromSlider(value: number) {
    const next = Math.max(priceBounds.min, Math.min(value, selectedMax - step))
    setMinPrice(next <= priceBounds.min ? '' : next)
  }

  function setMaxFromSlider(value: number) {
    const next = Math.min(priceBounds.max, Math.max(value, selectedMin + step))
    setMaxPrice(next >= priceBounds.max ? '' : next)
  }

  const filtered = useMemo(() => {
    let items = initialProducts.slice()

    if (query.trim()) {
      const q = query.toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
    }
    if (selectedCats.length) {
      items = items.filter((p) => (p.categories ?? []).some((c) => selectedCats.includes(c)))
    }
    if (minPrice !== '') items = items.filter((p) => (p.price ?? 0) >= Number(minPrice))
    if (maxPrice !== '') items = items.filter((p) => (p.price ?? 0) <= Number(maxPrice))

    if (sort === 'newest') items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (sort === 'price-asc') items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'price-desc') items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))

    return items
  }, [initialProducts, query, selectedCats, minPrice, maxPrice, sort])

  useEffect(() => {
    const t = setTimeout(() => setVisibleCount(viewMode === 'grid' ? gridInitialCount : listInitialCount), 0)
    return () => clearTimeout(t)
  }, [query, selectedCats, minPrice, maxPrice, sort, viewMode])

  useEffect(() => {
    const t = setTimeout(() => {
      track('products_filter_changed', {
        query_length: query.trim().length,
        categories_count: selectedCats.length,
        sort,
        min_price: minPrice === '' ? null : minPrice,
        max_price: maxPrice === '' ? null : maxPrice,
        results_count: filtered.length,
      })
    }, 500)

    return () => clearTimeout(t)
  }, [query, selectedCats, minPrice, maxPrice, sort, filtered.length])

  const countsByCategory = useMemo(() => {
    const map = new Map<string, number>()
    initialProducts.forEach((p) => {
      (p.categories ?? []).forEach((c) => map.set(c, (map.get(c) ?? 0) + 1))
    })
    return map
  }, [initialProducts])

  function toggleCategory(cat: string) {
    setSelectedCats((s) => (s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat]))
  }

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <div id="browse" className="grid grid-cols-1 lg:grid-cols-5 gap-8"> {/* wider gap, extra column for breathing */}
      {/* Sidebar filters (1 column) */}
      <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
        <div className="card p-4">
          <label className="block">
            <span className="text-sm text-muted">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search designs, metals, stones..."
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[rgb(var(--gold-rgb))] focus:ring-1 focus:ring-[rgb(var(--gold-rgb))] transition-all"
            />
          </label>
        </div>

        {/* Scrollable categories container */}
        <div className="card p-4">
          <div className="mb-3 text-sm font-medium">Categories</div>
          <div className="sidebar-scroll space-y-2">
            {categories.length === 0 && <div className="text-sm text-muted">—</div>}
            {categories.map((c) => {
              const active = selectedCats.includes(c)
              return (
                <button
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`w-full text-left rounded-md px-3 py-2 transition border flex items-center justify-between ${active ? 'bg-[rgba(212,175,55,0.08)] border-[rgba(212,175,55,0.14)]' : 'border-[var(--input-border)] hover:bg-[var(--glass)]'}`}
                >
                  <span>{c}</span>
                  <span className="text-sm text-muted">{countsByCategory.get(c) ?? 0}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Price</div>
              <div className="mt-1 text-xs text-muted">
                {formatINR(selectedMin)} — {formatINR(selectedMax)}
              </div>
            </div>

            <button
              type="button"
              disabled={minPrice === '' && maxPrice === ''}
              onClick={() => {
                setMinPrice('')
                setMaxPrice('')
              }}
              className="px-3 py-1.5 rounded-md border border-[var(--input-border)] text-xs text-muted transition-all hover:bg-[var(--glass)] hover:border-[rgba(212,175,55,0.25)] disabled:opacity-50 disabled:pointer-events-none"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 price-range">
            <div className="price-range__track">
              <div
                className="price-range__fill"
                style={{
                  left: `${minPercentClamped}%`,
                  right: `${Math.max(0, Math.min(100, 100 - maxPercentClamped))}%`,
                }}
              />
            </div>

            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={step}
              value={selectedMin}
              disabled={sliderDisabled}
              onChange={(e) => setMinFromSlider(Number(e.target.value))}
              className="price-range__input price-range__input--min"
              style={{
                clipPath: `inset(0 ${Math.max(0, 100 - splitPercentClamped)}% 0 0)`,
              }}
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={step}
              value={selectedMax}
              disabled={sliderDisabled}
              onChange={(e) => setMaxFromSlider(Number(e.target.value))}
              className="price-range__input price-range__input--max"
              style={{
                clipPath: `inset(0 0 0 ${splitPercentClamped}%)`,
              }}
              aria-label="Maximum price"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>{formatINR(priceBounds.min)}</span>
            <span>{formatINR(priceBounds.max)}</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 text-sm font-medium">Sort</div>
          <select
            value={sort}
            onChange={(e) => {
              const value = e.target.value
              if (sortOptions.includes(value as SortOption)) setSort(value as SortOption)
            }}
            className="w-full rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] p-3 outline-none focus:border-[rgb(var(--gold-rgb))] transition-all"
          >
            <option value="newest">Newest</option>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>


      </aside>

      {/* Main product area (4 columns) */}
      <div className="lg:col-span-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-muted">Showing <strong>{filtered.length}</strong> products</div>
            {query && <div className="text-sm text-muted mt-1">Results for “{query}”</div>}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted">
            <div>View</div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setViewMode('grid')
                  setVisibleCount(gridInitialCount)
                  track('products_view_mode_changed', { view_mode: 'grid' })
                }} 
                className={`px-4 py-1.5 rounded-md border transition-all duration-200 cursor-pointer relative z-10 font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-[rgba(212,175,55,0.15)] border-[rgba(212,175,55,0.4)] text-[rgb(212,175,55)] shadow-[0_0_10px_rgba(212,175,55,0.1)]' 
                    : 'border-[var(--input-border)] text-muted hover:bg-[var(--glass)] hover:border-[rgba(212,175,55,0.2)]'
                }`}
              >
                Grid
              </button>
              <button 
                onClick={() => {
                  setViewMode('list')
                  setVisibleCount(listInitialCount)
                  track('products_view_mode_changed', { view_mode: 'list' })
                }} 
                className={`px-4 py-1.5 rounded-md border transition-all duration-200 cursor-pointer relative z-10 font-medium ${
                  viewMode === 'list' 
                    ? 'bg-[rgba(212,175,55,0.15)] border-[rgba(212,175,55,0.4)] text-[rgb(212,175,55)] shadow-[0_0_10px_rgba(212,175,55,0.1)]' 
                    : 'border-[var(--input-border)] text-muted hover:bg-[var(--glass)] hover:border-[rgba(212,175,55,0.2)]'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8"
              : "flex flex-col gap-6 list-view-container"
          }>
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        <div className="collection-page__load-more">
          {hasMore ? (
            <button onClick={() => {
              setVisibleCount((c) => c + 12)
              track('products_load_more_clicked', { shown_count: visible.length, total_count: filtered.length })
            }} className="collection-page__load-btn">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              Load more
            </button>
          ) : (
            <div className="text-sm text-muted">No more results</div>
          )}
        </div>


      </div>
    </div>
  )
}
