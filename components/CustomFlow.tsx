// src/components/CustomFlow.tsx
'use client'
import { useState } from 'react'

export default function CustomFlow() {
  const steps = [
    'Consultation',
    'Brief & Moodboard',
    'Sketch & CAD',
    'Prototype',
    'Final production'
  ]
  const [step, setStep] = useState(0)
  return (
    <div className="card p-6 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <ol className="space-y-6">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i <= step ? 'bg-[rgba(212,175,55,0.18)]' : 'bg-white/6'}`}>{i+1}</div>
              <div>
                <div className="font-medium">{s}</div>
                <div className="text-sm text-muted mt-1">{i===0 ? 'Free 15-min consultation' : 'Detailed explanation for this step'}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <aside className="space-y-4">
        <div className="text-sm text-muted">Move through a sample timeline to see the typical workflow and lead time.</div>
        <div className="flex gap-2">
          <button onClick={() => setStep((s) => Math.max(0, s-1))} className="rounded-md px-3 py-2 border border-white/6">Prev</button>
          <button onClick={() => setStep((s) => Math.min(steps.length-1, s+1))} className="btn-cta">Next</button>
        </div>
        <div className="mt-3 text-sm">Est. lead time: 3–6 weeks (depending on complexity)</div>
      </aside>
    </div>
  )
}
