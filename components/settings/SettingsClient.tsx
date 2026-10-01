'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STUDY_GOALS, PREFERRED_HOURS, FOCUS_OPTIONS } from '@/lib/onboarding/types'
import { SectionLabel } from '@/components/ui/section-label'

interface SettingsProfile {
  study_goal?:           string | null
  exam_type?:             string | null
  daily_available_mins?: number | null
  preferred_hours?:      string | null
  focus_intensity?:      string | null
}

interface Props {
  initial: { ad: string; email: string; profile: SettingsProfile | null }
}

// ── Layout primitives ────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionLabel className="pb-2 border-b border-border">{title}</SectionLabel>
      {children}
    </section>
  )
}

/** One setting: label (+ optional hint) on the left, control right-aligned — or below with `stacked`. */
function Row({ label, hint, stacked, children }: {
  label: string; hint?: React.ReactNode; stacked?: boolean; children: React.ReactNode
}) {
  return (
    <div className={cn(
      'min-h-12 py-3 border-b border-border',
      stacked ? 'space-y-2.5' : 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6',
    )}>
      <div className="min-w-0">
        <p className="text-base font-medium text-text">{label}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

/** Small single-choice buttons — replaces the old card grids. */
function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-sm transition-colors duration-[160ms]',
        active
          ? 'border-accent bg-accent-soft text-accent font-medium'
          : 'border-border bg-surface text-text-secondary hover:border-border-strong',
      )}
    >
      {children}
    </button>
  )
}

export default function SettingsClient({ initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState(false)

  // Form state — seeded from the server-fetched initial profile, no client fetch.
  const [ad, setAd] = useState(initial.ad)
  const [email] = useState(initial.email)
  const [studyGoal, setStudyGoal] = useState(initial.profile?.study_goal ?? 'ders_basarisi')
  const [examType] = useState(initial.profile?.exam_type ?? '')
  const [dailyMins, setDailyMins] = useState(initial.profile?.daily_available_mins ?? 120)
  const [prefHours, setPrefHours] = useState(initial.profile?.preferred_hours ?? 'evening')
  const [intensity, setIntensity] = useState(initial.profile?.focus_intensity ?? 'normal')

  async function handleSave() {
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad,
          study_goal: studyGoal,
          exam_type: examType || null,
          daily_available_mins: dailyMins,
          preferred_hours: prefHours,
          focus_intensity: intensity,
        }),
      })
      if (!res.ok) { setSaveError(true); setTimeout(() => setSaveError(false), 3000); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    // Lazy-loaded: keeps supabase-js (~60 kB gz) out of the initial page bundle.
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/giris')
    router.refresh()
  }

  async function handleDelete() {
    if (deleteText !== 'SİL' || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/settings', { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setDeleteError(json?.message ?? 'Hesap silinemedi. Tekrar dene.')
        return
      }
      router.push('/giris')
      router.refresh()
    } catch {
      setDeleteError('Bağlantı hatası. Tekrar dene.')
    } finally {
      setDeleting(false)
    }
  }

  const inputClass =
    'h-9 w-full sm:w-64 rounded-md bg-surface border border-border px-3 text-sm text-text placeholder:text-text-muted ' +
    'focus:outline-none focus:border-accent transition-colors duration-[160ms]'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">Ayarlar</h1>
        <p className="text-base text-text-secondary mt-1">Profil ve tercihlerini yönet.</p>
      </div>

      <div className="space-y-12">
        {/* ── Profil ── */}
        <Section title="PROFİL">
          <Row label="Ad Soyad">
            <input
              value={ad}
              onChange={e => setAd(e.target.value)}
              placeholder="Adın Soyadın"
              aria-label="Ad Soyad"
              className={inputClass}
            />
          </Row>
          <Row label="E-posta" hint="Değiştirilemez">
            <p className="text-sm text-text-secondary truncate">{email}</p>
          </Row>
        </Section>

        {/* ── Çalışma ── */}
        <Section title="ÇALIŞMA AYARLARI">
          <Row label="Çalışma hedefi" stacked>
            <div className="flex flex-wrap gap-2">
              {STUDY_GOALS.map(g => (
                <Choice key={g.value} active={studyGoal === g.value} onClick={() => setStudyGoal(g.value)}>
                  <span>{g.emoji}</span>{g.label}
                </Choice>
              ))}
            </div>
          </Row>

          <Row label="Günlük süre" hint="30 dk – 6 saat">
            <div className="flex items-center gap-3 sm:w-64">
              <input
                type="range" min={30} max={360} step={15}
                value={dailyMins}
                onChange={e => setDailyMins(Number(e.target.value))}
                aria-label="Günlük çalışma süresi"
                className="flex-1 accent-[var(--accent)]"
              />
              <span className="tabular text-sm text-text w-16 text-right">
                {Math.floor(dailyMins / 60)}s {dailyMins % 60}dk
              </span>
            </div>
          </Row>

          <Row label="Tercih edilen saat" stacked>
            <div className="flex flex-wrap gap-2">
              {PREFERRED_HOURS.map(h => (
                <Choice key={h.value} active={prefHours === h.value} onClick={() => setPrefHours(h.value)}>
                  <span>{h.emoji}</span>{h.label}
                  <span className="tabular-nums text-xs text-text-muted">{h.range}</span>
                </Choice>
              ))}
            </div>
          </Row>

          <Row label="Odak yoğunluğu" stacked>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(f => (
                <Choice key={f.value} active={intensity === f.value} onClick={() => setIntensity(f.value)}>
                  <span>{f.emoji}</span>{f.label}
                </Choice>
              ))}
            </div>
          </Row>

          {/* One save for both sections — same PATCH as before */}
          <div className="flex items-center justify-end gap-3 pt-4">
            {saveError && <p className="text-sm text-danger">Kaydedilemedi — tekrar dene</p>}
            {saved && <p className="inline-flex items-center gap-1 text-sm text-success"><Check className="size-3.5" /> Kaydedildi</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-accent hover:bg-accent-dark text-white text-sm font-medium transition-colors duration-[160ms] disabled:opacity-60"
            >
              {saving ? <><Loader2 className="size-3.5 animate-spin" /> Kaydediliyor…</> : 'Kaydet'}
            </button>
          </div>
        </Section>

        {/* ── Hesap ── */}
        <Section title="HESAP">
          <Row label="Oturum" hint={email}>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface text-sm font-medium text-text hover:border-border-strong transition-colors duration-[160ms] self-start sm:self-auto"
            >
              <LogOut className="size-3.5" /> Çıkış Yap
            </button>
          </Row>
          <Row label="Sürüm"><p className="tabular text-sm text-text-secondary">1.0.0</p></Row>
          <Row label="Platform"><p className="text-sm text-text-secondary">Noetic OS Web</p></Row>
        </Section>

        {/* ── Danger zone — a text button, not a red card ── */}
        <section>
          {!showDeleteConfirm ? (
            <div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm font-medium text-danger hover:underline underline-offset-4"
              >
                Hesabımı Sil
              </button>
              <p className="text-xs text-text-muted mt-1">Hesabını silersen tüm verilerin kalıcı olarak silinir.</p>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-3 max-w-sm"
              >
                <p className="text-sm text-text">
                  Onaylamak için <strong className="font-semibold">SİL</strong> yaz. Tüm verilerin kalıcı olarak silinir.
                </p>
                <input
                  value={deleteText}
                  onChange={e => setDeleteText(e.target.value)}
                  placeholder="SİL"
                  aria-label="Onay metni"
                  className="h-9 w-full rounded-md bg-surface border border-border px-3 text-sm text-text focus:outline-none focus:border-danger"
                />
                {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDelete}
                    disabled={deleteText !== 'SİL' || deleting}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-danger disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleting && <Loader2 className="size-3.5 animate-spin" />}
                    {deleting ? 'Siliniyor…' : 'Kalıcı olarak sil'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); setDeleteError(null) }}
                    disabled={deleting}
                    className="text-sm text-text-secondary hover:text-text disabled:opacity-50"
                  >
                    İptal
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </div>
    </div>
  )
}
