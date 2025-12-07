// src/components/CraftFAQ.tsx
export default function CraftFAQ() {
  const faqs = [
    { q: 'How should I care for my jewelry?', a: 'Store separately, avoid chemicals, and use a soft cloth for polishing. See our downloadable care guide.' },
    { q: 'Do you offer resizing?', a: 'Yes — minor resizing complimentary within 6 months for qualifying pieces. Larger changes quoted separately.' },
    { q: 'Can you use my old gold?', a: 'Yes — we offer redesign services where we melt & reuse provided precious metals. Ask for an appraisal.' },
    { q: 'What certifications do you provide?', a: 'Diamonds and high-value gemstones come with grading documents (GIA/IGI) on request.' }
  ]

  return (
    <div className="grid gap-3">
      {faqs.map((f) => (
        <details key={f.q} className="card p-4">
          <summary className="font-medium cursor-pointer">{f.q}</summary>
          <div className="text-sm text-muted mt-2">{f.a}</div>
        </details>
      ))}
    </div>
  )
}
