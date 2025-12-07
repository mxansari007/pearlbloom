// src/components/ProcessTimeline.tsx
export default function ProcessTimeline() {
  const steps = [
    { title: 'Consultation', desc: 'Understand style, budget & timeline. Free 15-min consultations.' },
    { title: 'Design', desc: 'Hand sketches and CAD renderings for review.' },
    { title: 'Prototype', desc: 'Wax casting / 3D printed prototype for fit & approval.' },
    { title: 'Setting & Finish', desc: 'Stone setting, polishing, and final QC.' },
    { title: 'Certificate & Delivery', desc: 'Hallmark & certificate included with every piece.' }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {steps.map((s, i) => (
        <div key={s.title} className="card p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-white/6 inline-flex items-center justify-center mx-auto">{i + 1}</div>
          <h3 className="font-medium mt-3">{s.title}</h3>
          <p className="text-sm text-muted mt-2">{s.desc}</p>
        </div>
      ))}
    </div>
  )
}
