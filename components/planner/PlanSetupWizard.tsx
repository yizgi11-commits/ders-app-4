'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Zap, ChevronRight, ChevronLeft, Sparkles,
  AlertTriangle, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { INTENSITY_CONFIG } from '@/lib/planner/types'
import type { StudyIntensity, StudyPreferences } from '@/lib/planner/types'

interface SubjectItem {
  id: string
  name: string
  icon: string
  color: string
}

interface Props {
  subjects: SubjectItem[]
  existingPrefs: StudyPreferences | null
  onGenerate: (prefs: {
    daily_study_mins: number
    intensity: StudyIntensity
    start_hour: number
    subject_priorities: string[]
    weak_subjects: string[]
    week: boolean
  }) => void
  onCancel: () => void
  loading: boolean
}

const STEPS = ['Yoğunluk', 'Zaman', 'Dersler', 'Onayla']

export default function PlanSetupWizard({ subjects, existingPrefs, onGenerate, onCancel, loading }: Props) {
  const [step, setStep] = useState(0)
  const [intensity, setIntensity] = useState<StudyIntensity>(existingPrefs?.intensity ?? 'normal')
  const [dailyMins, setDailyMins] = useState(existingPrefs?.daily_study_mins ?? 120)
  const [startHour, setStartHour] = useState(existingPrefs?.start_hour ?? 16)
  const [priorities, setPriorities] = useState<string[]>(existingPrefs?.subject_priorities ?? [])
  const [weakSubs, setWeakSubs] = useState<string[]>(existingPrefs?.weak_subjects ?? [])
  const [weekMode, setWeekMode] = useState(true)

  useEffect(() => {
    if (priorities.length === 0 && subjects.length > 0) {
      setPriorities(subjects.map(s => s.id))
    }
  }, [subjects, priorities.length])

  const canNext = step < STEPS.length - 1
  const canPrev = step > 0

  function handleSubmit() {
    onGenerate({
      daily_study_mins: dailyMins,
      intensity,
      start_hour: startHour,
      subject_priorities: priorities,
      weak_subjects: weakSubs,
      week: weekMode,
    })
  }

  function movePriority(id: string, dir: -1 | 1) {
    const idx = priorities.indexOf(id)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= priorities.length) return
    const next = [...priorities]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    setPriorities(next)
  }

  function toggleWeak(id: string) {
    setWeakSubs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const cfg = INTENSITY_CONFIG[intensity]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Progress steps */}
      <div className="flex items-center gap-0 border-b border-gray-200 px-6 py-3 bg-gray-50/50">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <button
              onClick={() => i <= step && setStep(i)}
              className={cn(
                'flex items-center gap-2 text-xs font-medium transition-colors px-2 py-1 rounded-lg',
                i === step ? 'text-indigo-600 bg-indigo-50' :
                i < step ? 'text-emerald-600 cursor-pointer hover:bg-gray-100' :
                'text-gray-300 cursor-default',
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border',
                i === step ? 'border-indigo-300 bg-indigo-100 text-indigo-600' :
                i < step ? 'border-emerald-300 bg-emerald-100 text-emerald-600' :
                'border-gray-200 bg-gray-100 text-gray-400',
              )}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-gray-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="p-6 min-h-[320px]">
        <AnimatePresence mode="wait">
          {/* STEP 0: Intensity */}
          {step === 0 && (
            <motion.div
              key="intensity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-base font-bold text-gray-900 mb-1">Çalışma Yoğunluğu</h2>
              <p className="text-xs text-gray-500 mb-5">Günlük tempo ve oturum süresini belirler.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.entries(INTENSITY_CONFIG) as [StudyIntensity, typeof cfg][]).map(([key, val]) => (
                  <motion.button
                    key={key}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIntensity(key)}
                    className={cn(
                      'text-left p-4 rounded-xl border transition-all',
                      intensity === key
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100'
                        : 'bg-gray-50/50 border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <span className="text-2xl">{val.emoji}</span>
                    <h4 className="text-sm font-bold text-gray-900 mt-2">{val.label}</h4>
                    <p className="text-[11px] text-gray-500 mt-1">{val.desc}</p>
                    <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                      <span>{val.sessionMins}dk oturum</span>
                      <span>·</span>
                      <span>{val.breakMins}dk mola</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1: Time settings */}
          {step === 1 && (
            <motion.div
              key="time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-base font-bold text-gray-900 mb-1">Zaman Ayarları</h2>
              <p className="text-xs text-gray-500 mb-6">Günlük çalışma süren ve başlangıç saatin.</p>

              <div className="space-y-6 max-w-sm">
                {/* Daily minutes */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    Günlük Çalışma Süresi
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={30}
                      max={360}
                      step={15}
                      value={dailyMins}
                      onChange={e => setDailyMins(Number(e.target.value))}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-sm font-bold text-indigo-600 w-16 text-right">
                      {Math.floor(dailyMins / 60)}s {dailyMins % 60}dk
                    </span>
                  </div>
                </div>

                {/* Start hour */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5" />
                    Başlangıç Saati
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={6}
                      max={22}
                      step={1}
                      value={startHour}
                      onChange={e => setStartHour(Number(e.target.value))}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-sm font-bold text-indigo-600 w-16 text-right">
                      {String(startHour).padStart(2, '0')}:00
                    </span>
                  </div>
                </div>

                {/* Week / Day toggle */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Plan Türü
                  </label>
                  <div className="flex gap-2">
                    {[
                      { val: true, label: 'Haftalık Plan', desc: '7 günlük program' },
                      { val: false, label: 'Günlük Plan', desc: 'Sadece bugün' },
                    ].map(opt => (
                      <button
                        key={String(opt.val)}
                        onClick={() => setWeekMode(opt.val)}
                        className={cn(
                          'flex-1 text-left p-3 rounded-xl border transition-all text-sm',
                          weekMode === opt.val
                            ? 'bg-indigo-50 border-indigo-200 text-gray-900 font-semibold'
                            : 'bg-gray-50/50 border-gray-200 text-gray-500 hover:border-gray-300',
                        )}
                      >
                        {opt.label}
                        <span className="block text-[10px] text-gray-400 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Subjects */}
          {step === 2 && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-base font-bold text-gray-900 mb-1">Ders Öncelikleri</h2>
              <p className="text-xs text-gray-500 mb-5">Sırala ve zayıf dersleri işaretle. Üstteki dersler daha fazla zaman alır.</p>

              {subjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Henüz ders eklenmemiş. Önce &ldquo;Derslerim&rdquo; sayfasından ders ekleyin.
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {priorities.map((id, idx) => {
                    const sub = subjects.find(s => s.id === id)
                    if (!sub) return null
                    const isWeak = weakSubs.includes(id)
                    return (
                      <motion.div
                        key={id}
                        layout
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border transition-all',
                          isWeak
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-gray-50/50 border-gray-200',
                        )}
                      >
                        {/* Rank */}
                        <span className="text-[10px] font-bold text-gray-400 w-5 text-center">
                          {idx + 1}
                        </span>

                        {/* Icon */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border border-gray-200 shrink-0"
                          style={{ background: `${sub.color}15` }}
                        >
                          {sub.icon}
                        </div>

                        {/* Name */}
                        <span className="text-sm font-medium text-gray-900 flex-1">{sub.name}</span>

                        {/* Weak toggle */}
                        <button
                          onClick={() => toggleWeak(id)}
                          className={cn(
                            'flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border transition-all',
                            isWeak
                              ? 'text-amber-600 bg-amber-100 border-amber-200'
                              : 'text-gray-400 bg-gray-100 border-gray-200 hover:text-gray-600',
                          )}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Zayıf
                        </button>

                        {/* Move buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => movePriority(id, -1)}
                            disabled={idx === 0}
                            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors"
                          >
                            <ChevronLeft className="w-3 h-3 rotate-90" />
                          </button>
                          <button
                            onClick={() => movePriority(id, 1)}
                            disabled={idx === priorities.length - 1}
                            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors"
                          >
                            <ChevronRight className="w-3 h-3 rotate-90" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-base font-bold text-gray-900 mb-1">Plan Özeti</h2>
              <p className="text-xs text-gray-500 mb-5">Ayarlarını kontrol et ve programını oluştur.</p>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                <SummaryCard label="Yoğunluk" value={`${cfg.emoji} ${cfg.label}`} />
                <SummaryCard label="Günlük Süre" value={`${Math.floor(dailyMins / 60)}s ${dailyMins % 60}dk`} />
                <SummaryCard label="Başlangıç" value={`${String(startHour).padStart(2, '0')}:00`} />
                <SummaryCard label="Plan Türü" value={weekMode ? 'Haftalık' : 'Günlük'} />
                <SummaryCard label="Ders Sayısı" value={`${subjects.length} ders`} />
                <SummaryCard label="Zayıf Dersler" value={`${weakSubs.length} ders`} />
              </div>

              {weakSubs.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {weakSubs.map(id => {
                    const sub = subjects.find(s => s.id === id)
                    return sub ? (
                      <span key={id} className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        {sub.icon} {sub.name}
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {canPrev && (
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Geri
            </motion.button>
          )}
          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-2"
          >
            İptal
          </button>
        </div>

        {canNext ? (
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
          >
            Devam
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? 'Oluşturuluyor…' : 'Programı Oluştur'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
