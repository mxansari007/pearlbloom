// src/app/craft/page.tsx
import type { Metadata } from 'next'
import CraftHero from '../../components/CraftHero'
import ProcessTimeline from '../../components/ProcessTimeline'
import MaterialsGrid from '../../components/MaterialGrid'
import StudioTeam from '../../components/StudioTeam'
import TechniqueShowcase from '../../components/TechniqueShowcase'
import BeforeAfterGallery from '../../components/BeforeAfterGallery'
import CustomFlow from '../../components/CustomFlow'
import CraftFAQ from '../../components/CraftFAQ'
import CraftCTA from '../../components/CraftCTA'

export const metadata: Metadata = {
  title: 'Our Craft — Aurum',
  description: 'Discover how Aurum crafts heirloom jewelry: materials, studio, techniques, custom design workflow and lifetime care.'
}

export default function CraftPage() {
  return (
    <main className="container py-14 space-y-12">
      <CraftHero
        title="Our Craft — Heirloom Jewelry, Made by Hand"
        subtitle="Each piece begins with a sketch and a promise: beauty that lasts generations."
        image="https://images.unsplash.com/photo-1520975698515-1c7c43d86a51?q=80&w=1600&auto=format&fit=crop"
      />

      <section aria-labelledby="process" className="space-y-6">
        <h2 id="process" className="text-2xl font-display">Our process</h2>
        <ProcessTimeline />
      </section>

      <section aria-labelledby="materials" className="space-y-6">
        <h2 id="materials" className="text-2xl font-display">Materials & sourcing</h2>
        <MaterialsGrid />
      </section>

      <section aria-labelledby="studio" className="space-y-6">
        <h2 id="studio" className="text-2xl font-display">Studio & team</h2>
        <StudioTeam />
      </section>

      <section aria-labelledby="techniques" className="space-y-6">
        <h2 id="techniques" className="text-2xl font-display">Technique showcase</h2>
        <TechniqueShowcase />
      </section>

      <section aria-labelledby="beforeafter" className="space-y-6">
        <h2 id="beforeafter" className="text-2xl font-display">Before & after</h2>
        <BeforeAfterGallery />
      </section>

      <section aria-labelledby="custom" className="space-y-6">
        <h2 id="custom" className="text-2xl font-display">Custom design — how it works</h2>
        <CustomFlow />
      </section>

      <section aria-labelledby="faq" className="space-y-6">
        <h2 id="faq" className="text-2xl font-display">Frequently asked</h2>
        <CraftFAQ />
      </section>

      <CraftCTA />
    </main>
  )
}
