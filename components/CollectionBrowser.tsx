// src/components/CollectionBrowser.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Product } from '../types/products'
import ProductCard from './ProductCard'

type Props = {
  initialProducts: Product[]
  categories?: string[]
}

export default function CollectionBrowser({ initialProducts, categories = [] }: Props) {
  const [query, setQuery] = useState('')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('newest')
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [visibleCount, setVisibleCount] = useState(9) // show 9 initially for balanced grid

  const filtered = useMemo(() => {
    let items = initialProducts.slice()

    if (query.trim()) {
      const q = query.toLowerCase()
      items = items.filter((p) => p.title.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
    }
    if (selectedCats.length) {
      items = items.filter((p) => (p.categories ?? []).some((c) => selectedCats.includes(c)))
    }
    if (minPrice !== '') items = items.filter((p) => (p.price ?? 0) >= Number(minPrice))
    if (maxPrice !== '') items = items.filter((p) => (p.price ?? 0) <= Number(maxPrice))

    if (sort === 'price-asc') items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'price-desc') items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))

    return items
  }, [initialProducts, query, selectedCats, minPrice, maxPrice, sort])

  useEffect(() => { setVisibleCount(9) }, [query, selectedCats, minPrice, maxPrice, sort])

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
      <aside className="lg:col-span-1 space-y-6">
        <div className="card p-4">
          <label className="block">
            <span className="text-sm text-muted">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search designs, metals, stones..."
              className="mt-2 block w-full rounded-md bg-transparent border border-white/6 p-3"
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
                  className={`w-full text-left rounded-md px-3 py-2 transition border flex items-center justify-between ${active ? 'bg-[rgba(212,175,55,0.08)] border-[rgba(212,175,55,0.14)]' : 'border-white/6'}`}
                >
                  <span>{c}</span>
                  <span className="text-sm text-muted">{countsByCategory.get(c) ?? 0}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 text-sm font-medium">Price</div>
          <div className="flex gap-3">
            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Min"
              className="w-1/2 rounded-md bg-transparent border border-white/6 p-2"
            />
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Max"
              className="w-1/2 rounded-md bg-transparent border border-white/6 p-2"
            />
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 text-sm font-medium">Sort</div>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="w-full rounded-md bg-transparent border border-white/6 p-2">
            <option value="newest">Newest</option>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>

        <div className="card p-4 text-center">
          <div className="text-sm text-muted">Need help picking a piece?</div>
          <a href="/contact" className="btn-cta mt-3 inline-block">Contact us</a>
          <div className="text-sm text-muted mt-3">or call +91 98765 43210</div>
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
              <button onClick={() => setVisibleCount(9)} className="px-3 py-1 rounded-md border border-white/6">Grid</button>
              <button onClick={() => setVisibleCount(24)} className="px-3 py-1 rounded-md border border-white/6">List</button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          {hasMore ? (
            <button onClick={() => setVisibleCount((c) => c + 12)} className="rounded-md px-6 py-3 border border-white/6 btn-cta">
              Load more
            </button>
          ) : (
            <div className="text-sm text-muted">No more results</div>
          )}
        </div>

        <div className="mt-10 card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg">Not sure which to choose?</h3>
            <p className="text-sm text-muted mt-2">Book a free consultation with our design specialist or request a private viewing.</p>
          </div>
          <div className="flex gap-3">
            <a href="/contact" className="btn-cta">Book consultation</a>
            <a href="/about" className="rounded-md px-4 py-2 border border-white/6 hover:bg-white/2 transition text-sm">Why Pearl Bloom</a>
          </div>
        </div>
      </div>
    </div>
  )
}
