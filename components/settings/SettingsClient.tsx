'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Shield, Trash2, ChevronRight,
  Check, Loader2, LogOut, Bell, Palette, BookOpen,
  AlertTriangle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { STUDY_GOALS, PREFERRED_HOURS, FOCUS_OPTIONS } from '@/lib/onboarding/types'

type Section = 'profil' | 'calisma' | 'hesap'

export default function SettingsClient() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('profil')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  // Form state
  const [ad, setAd] = useState('')
  const [email, setEmail] = useState('')
  const [studyGoal, setStudyGoal] = useState('ders_basarisi')
  const [examType, setExamType] = useState('')
  const [dailyMins, setDailyMins] = useState(120)
  const [prefHours, setPrefHours] = useState('evening')
  const [intensity, setIntensity] = useState('normal')

  // Load
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setAd(data.ad ?? '')
        setEmail(data.email ?? '')
        setStudyGoal(data.profile?.study_goal ?? 'ders_basarisi')
        setExamType(data.profile?.exam_type ?? '')
        setDailyMins(data.profile?.daily_available_mins ?? 120)
        setPrefHours(data.profile?.preferred_hours ?? 'evening')
        setIntensity(data.profile?.focus_intensity ?? 'normal')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/settings', {
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
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/giris')
    router.refresh()
  }

  async function handleDelete() {
    if (deleteText !== 'SİL') return
    await fetch('/api/settings', { method: 'DELETE' })
    router.push('/giris')
    router.refresh()
  }

  const navItems: { key: Section; label: string; icon: typeof User }[] = [
    { key: 'profil',   label: 'Profil',           icon: User },
    { key: 'calisma',  label: 'Çalışma Ayarları',  icon: BookOpen },
    { key: 'hesap',    label: 'Hesap & Güvenlik',  icon: Shield },
  ]

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Profil ve tercihlerini yönet.</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-5">

        {/* Sidebar nav */}
        <motion.nav
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="sm:w-48 flex sm:flex-col gap-1"
        >
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full',
                section === key
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {section === key && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </motion.nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">

            {/* ── Profil ── */}
            {section === 'profil' && (
              <motion.div
                key="profil"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5"
              >
                <h2 className="text-sm font-bold text-gray-700">Profil Bilgileri</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-200">
                    {ad.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{ad || 'İsimsiz'}</p>
                    <p className="text-xs text-gray-400">{email}</p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Ad Soyad
                  </label>
                  <input
                    value={ad}
                    onChange={e => setAd(e.target.value)}
                    placeholder="Adın Soyadın"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all bg-gray-50/50"
                  />
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> E-posta
                  </label>
                  <div className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-400 bg-gray-50 flex items-center gap-2">
                    <span className="flex-1">{email}</span>
                    <span className="text-[10px] text-gray-300 bg-gray-100 px-2 py-0.5 rounded-md">Değiştirilemez</span>
                  </div>
                </div>

                <SaveButton saving={saving} saved={saved} onClick={handleSave} />
              </motion.div>
            )}

            {/* ── Çalışma Ayarları ── */}
            {section === 'calisma' && (
              <motion.div
                key="calisma"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6"
              >
                <h2 className="text-sm font-bold text-gray-700">Çalışma Ayarları</h2>

                {/* Study goal */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Çalışma Hedefi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STUDY_GOALS.map(g => (
                      <button
                        key={g.value}
                        onClick={() => setStudyGoal(g.value)}
                        className={cn(
                          'flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left',
                          studyGoal === g.value
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-gray-50/50 border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        <span className="text-lg">{g.emoji}</span>
                        <span className="text-xs font-semibold">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily minutes */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Günlük Süre</span>
                    <span className="text-indigo-600 font-bold normal-case">
                      {Math.floor(dailyMins / 60)}s {dailyMins % 60}dk
                    </span>
                  </label>
                  <input
                    type="range" min={30} max={360} step={15}
                    value={dailyMins}
                    onChange={e => setDailyMins(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                    <span>30 dk</span><span>6 saat</span>
                  </div>
                </div>

                {/* Preferred hours */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Tercih Edilen Saat
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PREFERRED_HOURS.map(h => (
                      <button
                        key={h.value}
                        onClick={() => setPrefHours(h.value)}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                          prefHours === h.value
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span>{h.emoji}</span>
                        <div>
                          <p className={cn('text-xs font-semibold', prefHours === h.value ? 'text-indigo-700' : 'text-gray-600')}>{h.label}</p>
                          <p className="text-[10px] text-gray-400">{h.range}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Odak Yoğunluğu
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {FOCUS_OPTIONS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setIntensity(f.value)}
                        className={cn(
                          'text-center p-3 rounded-xl border transition-all',
                          intensity === f.value
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="text-xl">{f.emoji}</span>
                        <p className={cn('text-xs font-semibold mt-1', intensity === f.value ? 'text-indigo-700' : 'text-gray-600')}>
                          {f.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <SaveButton saving={saving} saved={saved} onClick={handleSave} />
              </motion.div>
            )}

            {/* ── Hesap & Güvenlik ── */}
            {section === 'hesap' && (
              <motion.div
                key="hesap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Sign out */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-700 mb-4">Oturum</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Çıkış Yap</p>
                      <p className="text-xs text-gray-400 mt-0.5">{email}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSignOut}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </motion.button>
                  </div>
                </div>

                {/* App info */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-700 mb-4">Uygulama</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Versiyon', value: '1.0.0' },
                      { label: 'Platform', value: 'Noetic OS Web' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{item.label}</span>
                        <span className="text-sm font-semibold text-gray-700">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete account */}
                <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-red-600 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tehlikeli Bölge
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">
                    Hesabını silersen tüm verilerin kalıcı olarak silinir.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-semibold bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hesabımı Sil
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-xs text-red-500 font-medium">
                        Onaylamak için aşağıya <strong>SİL</strong> yaz:
                      </p>
                      <input
                        value={deleteText}
                        onChange={e => setDeleteText(e.target.value)}
                        placeholder="SİL"
                        className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowDeleteConfirm(false); setDeleteText('') }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleteText !== 'SİL'}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                        >
                          Kalıcı Olarak Sil
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Save button ──────────────────────────────────────────────────
function SaveButton({
  saving, saved, onClick,
}: {
  saving: boolean; saved: boolean; onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={saving}
      whileHover={!saving ? { scale: 1.02 } : {}}
      whileTap={!saving ? { scale: 0.97 } : {}}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
        saved
          ? 'bg-emerald-500 text-white'
          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-200/60'
      )}
    >
      {saving ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor…</>
      ) : saved ? (
        <><Check className="w-4 h-4" /> Kaydedildi!</>
      ) : (
        'Kaydet'
      )}
    </motion.button>
  )
}
