// src/components/MaterialsGrid.tsx
export default function MaterialsGrid() {
  const cards = [
    { title: 'Metals', body: '18K/14K gold & platinum. Recycled options available.', img: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Diamonds', body: 'Conflict-free, GIA/IGI grading on request.', img: 'https://images.unsplash.com/photo-1581579180032-3a16a2f0b7f4?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Gemstones', body: 'Traceable origins, heat/clarity treatments disclosed.', img: 'https://images.unsplash.com/photo-1562774055-1f6f2d8d1f8b?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Hallmarks & Assay', body: 'All pieces are hallmarked and come with certificates when applicable.', img: 'https://images.unsplash.com/photo-1530089706275-89b7f1c7a9d8?q=80&w=1200&auto=format&fit=crop' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map(c => (
        <div key={c.title} className="card overflow-hidden">
          <img src={c.img} alt={c.title} className="w-full h-40 object-cover" loading="lazy" />
          <div className="p-4">
            <h4 className="font-medium">{c.title}</h4>
            <p className="text-sm text-muted mt-2">{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
