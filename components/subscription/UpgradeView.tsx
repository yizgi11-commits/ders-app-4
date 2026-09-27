import { Check } from 'lucide-react'
import type { SubscriptionTier } from '@/lib/subscription'
import { SectionLabel } from '@/components/ui/section-label'

interface Row { label: string; free: string | boolean; pro: string | boolean }

const ROWS: Row[] = [
  { label: 'Command Center, Atlas, Planner, Focus, Journey', free: 'Sınırsız', pro: 'Sınırsız' },
  { label: 'Recall (günlük tekrar)',                          free: '20 kart/gün', pro: 'Sınırsız' },
  { label: 'Vault — Notlar',                                  free: '10 not',      pro: 'Sınırsız' },
  { label: 'Vault — Flashcard',                                free: '20 kart',     pro: 'Sınırsız' },
  { label: 'Vault — PDF',                                      free: '1 PDF',       pro: 'Sınırsız' },
  { label: 'Noetic Assist (günlük istek)',                     free: '5/gün',       pro: '30/gün' },
  { label: 'Noetic Assist — serbest metin',                    free: false,         pro: true },
  { label: 'PDF → Flashcard, Quiz, Özet (AI)',                 free: false,         pro: true },
  { label: 'Insights — temel metrikler',                       free: true,          pro: true },
  { label: 'Insights — tam analiz (verimli saatler, ısı haritası, ders analizi)', free: false, pro: true },
  { label: 'AI Insights (haftalık yorum)',                     free: false,         pro: true },
  { label: 'Learning Score',                                   free: true,          pro: true },
  { label: 'Weekly Review — özet',                             free: true,          pro: true },
  { label: 'Weekly Review — tam rapor + Next Week Builder',    free: false,         pro: true },
]

function Included({ label, detail, accent = false }: { label: string; detail?: string; accent?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-b-0">
      <Check className={accent ? 'size-4 mt-0.5 shrink-0 text-accent' : 'size-4 mt-0.5 shrink-0 text-text-secondary'} />
      <span className="flex-1 text-sm text-text">
        {label}
        {detail && <span className="text-text-muted"> · {detail}</span>}
      </span>
    </li>
  )
}

/** Pro-only feature, shown calmly in the Free column — a small tag, no red, no blur. */
function ProOnly({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-b-0">
      <span className="size-4 mt-0.5 shrink-0" aria-hidden />
      <span className="flex-1 text-sm text-text-muted">{label}</span>
      <span className="shrink-0 rounded-sm bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium tracking-[0.04em] text-accent">PRO</span>
    </li>
  )
}

export default function UpgradeView({ tier }: { tier: SubscriptionTier }) {
  const mailtoHref = 'mailto:yizgi11@gmail.com?subject=' + encodeURIComponent("Noetic Pro'ya geçmek istiyorum")

  // Pro column lists only what changes — everything else is "in Free" already.
  const proDiffs = ROWS.filter(r => r.pro !== r.free)

  const currentPlan = (
    <span className="inline-flex items-center justify-center h-9 w-full rounded-md border border-border text-sm font-medium text-text-muted">
      Current Plan
    </span>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">Noetic Pro</h1>
        <p className="text-base text-text-secondary mt-1">
          Sınırsız Recall ve Vault, tam analiz ve AI desteği — <span className="tabular">$9.99</span>/ay
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Free */}
        <section className="flex flex-col rounded-lg border border-border bg-surface p-5">
          <SectionLabel className="pb-2 border-b border-border">FREE</SectionLabel>
          <ul className="flex-1">
            {ROWS.map(r => (
              r.free === false
                ? <ProOnly key={r.label} label={r.label} />
                : <Included key={r.label} label={r.label} detail={typeof r.free === 'string' ? r.free : undefined} />
            ))}
          </ul>
          <div className="pt-5">{tier === 'free' && currentPlan}</div>
        </section>

        {/* Pro */}
        <section className="flex flex-col rounded-lg border border-accent/40 bg-surface p-5">
          <SectionLabel className="pb-2 border-b border-border">PRO</SectionLabel>
          <ul className="flex-1">
            <Included label="Free’deki her şey" accent />
            {proDiffs.map(r => (
              <Included key={r.label} label={r.label} detail={typeof r.pro === 'string' ? r.pro : undefined} accent />
            ))}
          </ul>
          <div className="pt-5">
            {tier === 'pro' ? currentPlan : (
              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center h-9 w-full rounded-md bg-accent hover:bg-accent-dark text-white text-sm font-medium transition-colors duration-[160ms]"
              >
                Try Pro
              </a>
            )}
          </div>
        </section>
      </div>

      {tier !== 'pro' && (
        <p className="mt-6 text-xs text-text-muted">
          Ödeme altyapısı henüz hazır değil — &quot;Try Pro&quot; bizimle e-postayla iletişime geçer, Pro&apos;yu manuel olarak açarız.
        </p>
      )}
    </div>
  )
}
