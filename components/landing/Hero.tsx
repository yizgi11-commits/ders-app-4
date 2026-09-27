'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { EASE_CURVE } from '@/lib/motion'

/** Staged entrance: label 200ms → headline 400ms → copy 600ms → CTA 750ms → product 900ms. */
const enter = (delay: number, y = 0) => ({
  initial:    { opacity: 0, y },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: EASE_CURVE },
})

// A simplified, static rendering of the real Command Center — not a screenshot.
function ProductMockup() {
  const rows = [
    { done: true,  n: '01', t: 'Türev — soru çözümü',        s: 'Matematik', m: '45 min' },
    { done: false, n: '02', t: 'Fonksiyonlar — tanım kümesi', s: 'Matematik', m: '30 min' },
    { done: false, n: '03', t: 'Newton yasaları tekrarı',     s: 'Fizik',     m: '25 min' },
  ]
  return (
    <div className="rounded-lg border border-dark-border overflow-hidden shadow-lg bg-background text-left">
      {/* Window bar */}
      <div className="h-8 flex items-center gap-1.5 px-3 bg-dark-base border-b border-dark-border">
        {[0, 1, 2].map(i => <span key={i} className="size-2 rounded-full bg-dark-border" />)}
      </div>
      <div className="flex h-[300px] sm:h-[380px]">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col w-44 shrink-0 bg-dark-base px-3 py-4 gap-1">
          <p className="px-2 mb-3 text-[11px] font-semibold tracking-wide text-dark-text">NOETIC</p>
          <p className="px-2 mb-1 text-[9px] tracking-[0.08em] text-dark-text-secondary">WORKSPACE</p>
          {['Command Center', 'Focus', 'Atlas', 'Planner'].map((l, i) => (
            <div key={l} className={`relative px-2 py-1.5 rounded text-[11px] ${i === 0 ? 'bg-white/[0.09] text-dark-text' : 'text-dark-text-secondary'}`}>
              {i === 0 && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />}
              {l}
            </div>
          ))}
          <p className="px-2 mt-3 mb-1 text-[9px] tracking-[0.08em] text-dark-text-secondary">LEARNING</p>
          {['Vault', 'Recall', 'Journey', 'Insights'].map(l => (
            <div key={l} className="px-2 py-1.5 text-[11px] text-dark-text-secondary">{l}</div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0 p-5 sm:p-7">
          <p className="text-[17px] font-semibold text-text">Good evening, Deniz.</p>
          <p className="text-[11px] text-text-secondary mt-0.5">Thursday, 24 September · Here&apos;s what matters today.</p>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-accent-soft border border-[rgba(49,92,255,0.15)] border-l-[3px] border-l-accent px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-[9px] tracking-[0.08em] text-accent">NEXT ACTION</p>
              <p className="text-[12px] font-semibold text-text truncate">Fonksiyonlar — tanım kümesi</p>
              <p className="text-[10px] text-text-secondary">Matematik · 30 min</p>
            </div>
            <span className="shrink-0 rounded bg-accent px-2.5 py-1 text-[10px] font-medium text-white">Start →</span>
          </div>

          <p className="mt-3 text-[11px] text-text-secondary">
            <span className="tabular text-text">3</span> tasks · <span className="tabular text-text">100</span> min · <span className="tabular text-text">5</span> reviews · Learning Score: <span className="tabular text-text">72</span>
          </p>

          <p className="mt-4 pb-1.5 border-b border-border text-[9px] tracking-[0.08em] text-text-muted">TODAY&apos;S PLAN</p>
          {rows.map(r => (
            <div key={r.n} className="h-9 flex items-center gap-2.5 border-b border-border">
              <span className={`size-3 rounded-[3px] border ${r.done ? 'bg-accent border-accent' : 'border-border-strong bg-surface'}`} />
              <span className="tabular text-[10px] text-text-muted">{r.n}</span>
              <span className={`flex-1 truncate text-[11px] font-medium ${r.done ? 'line-through text-text-muted' : 'text-text'}`}>{r.t}</span>
              <span className="hidden sm:inline rounded-sm bg-accent-soft px-1 text-[9px] text-accent">{r.s}</span>
              <span className="tabular text-[10px] text-text-muted">{r.m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="px-5 pt-20 sm:pt-28 pb-20">
      <div className="max-w-3xl mx-auto text-center">
        <motion.p {...enter(0.2)} className="text-[13px] font-medium text-accent">
          Kişisel Öğrenme İşletim Sistemi
        </motion.p>

        <motion.h1
          {...enter(0.4, 12)}
          className="mt-4 text-3xl sm:text-hero font-semibold leading-[1.08] tracking-[-0.02em] text-dark-text"
        >
          Daha fazla çalışmak değil.
          <br />
          Daha bilinçli öğrenmek.
        </motion.h1>

        <motion.p {...enter(0.6)} className="mt-6 text-[16px] leading-7 text-dark-text-secondary max-w-xl mx-auto">
          Noetic OS, bilimsel öğrenme yöntemleri ve yapay zekâ ile
          öğrenme sürecini yöneten kişisel öğrenme işletim sistemidir.
        </motion.p>

        <motion.div {...enter(0.75)} className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/kayit"
            className="inline-flex items-center gap-2 rounded-md bg-accent hover:bg-accent-dark px-6 py-3 text-md font-medium text-white transition-colors duration-[160ms]"
          >
            Ücretsiz Başla →
          </Link>
          <Link href="/giris" className="text-sm text-dark-text-secondary hover:text-dark-text transition-colors duration-[160ms]">
            Zaten hesabım var
          </Link>
        </motion.div>
      </div>

      <motion.div {...enter(0.9, 24)} className="mt-16 max-w-[900px] mx-auto">
        <ProductMockup />
      </motion.div>
    </section>
  )
}
