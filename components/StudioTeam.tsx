// src/components/StudioTeam.tsx
export default function StudioTeam() {
  const people = [
    { name: 'Anita Verma', title: 'Founder & Lead Designer', bio: '20+ years crafting bespoke jewelry.', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop' },
    { name: 'Rajat Singh', title: 'Master Setter', bio: 'Expert gem setting and finishing.', img: 'https://images.unsplash.com/photo-1545996124-8f3f7a6b0e2b?q=80&w=600&auto=format&fit=crop' },
    { name: 'Meera Joshi', title: 'CAD Specialist', bio: 'Transforms sketches into precise CAD models.', img: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=600&auto=format&fit=crop' }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {people.map(p => (
        <div key={p.name} className="card p-4 text-center">
          <img src={p.img} alt={p.name} className="w-28 h-28 rounded-full mx-auto object-cover" loading="lazy" />
          <h4 className="mt-3 font-medium">{p.name}</h4>
          <div className="text-sm text-muted">{p.title}</div>
          <p className="text-sm text-muted mt-2">{p.bio}</p>
        </div>
      ))}
    </div>
  )
}
