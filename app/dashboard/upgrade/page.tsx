import { redirect } from 'next/navigation'
import { Check, X, Sparkles, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/subscription'

export const metadata = { title: 'Upgrade' }

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

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
      : <X className="w-4 h-4 text-gray-300 mx-auto" />
  }
  return <span>{value}</span>
}

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const tier = await getUserTier(supabase, user.id)

  const mailtoHref = 'mailto:pro@noeticos.app?subject=' + encodeURIComponent("Noetic Pro'ya geçmek istiyorum")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Noetic Pro</h1>
        <p className="text-sm text-muted-foreground">Sınırsız Recall, Vault ve tam AI destek — $9.99/ay</p>
      </div>

      {tier === 'pro' ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-bold text-emerald-700">Zaten Pro&apos;dasın 🎉</p>
          <p className="text-xs text-emerald-600/80 mt-1">Her şey sınırsız — keyfini çıkar.</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-200/50 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" /> Try Pro
          </a>
        </div>
      )}

      {tier !== 'pro' && (
        <p className="text-center text-[11px] text-muted-foreground">
          Ödeme altyapısı henüz hazır değil — yukarıdaki buton bizimle iletişime geçer, Pro&apos;yu manuel olarak açarız.
        </p>
      )}

      {/* Comparison table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-bold text-gray-900 px-5 py-3.5">Özellik</th>
                <th className="text-center font-bold text-gray-500 px-4 py-3.5 w-28">Free</th>
                <th className="text-center font-bold text-indigo-600 px-4 py-3.5 w-28">Pro</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-gray-50/60' : ''}>
                  <td className="px-5 py-3 text-gray-700">{row.label}</td>
                  <td className="px-4 py-3 text-center text-gray-500"><Cell value={row.free} /></td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900"><Cell value={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
