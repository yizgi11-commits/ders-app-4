'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertCircle, BookOpen, Lightbulb,
  BarChart2, Flame, Target, Loader2
} from 'lucide-react'
import type { WeeklyReport } from '@/lib/ai/types'

const TREND_CONFIG = {
  improving: { icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Gelişiyor 📈' },
  stable:    { icon: Minus,        color: 'text-indigo-400',  bg: 'bg-indigo-500/10  border-indigo-500/20',  label: 'İstikrarlı ➡️' },
  declining: { icon: TrendingDown, color: 'text-amber-400',   bg: 'bg-amber-500/10   border-amber-500/20',   label: 'Düşüyor 📉' },
}

interface Props {
  onClose: () => void
}

export default function WeeklyReportModal({ onClose }: Props) {
  const [data, setData]       = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    fetch('/api/ai/weekly-report')
      .then(r => r.json())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const trend = data ? TREND_CONFIG[data.productivity_trend] : null
  const TrendIcon = trend?.icon ?? Minus

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[65] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1,    y: 0,  opacity: 1 }}
        exit={{    scale: 0.95, y: 12, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.1] rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500/30 to-violet-500/20 rounded-xl border border-indigo-500/25 flex items-center justify-center">
              <BarChart2 className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Haftalık AI Raporu</h2>
              <p className="text-[10px] text-white/30">Kişisel verimlilik analizi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full"
                />
                <p className="text-xs text-white/30">AI haftalık rapor hazırlıyor…</p>
                <p className="text-[10px] text-white/15">Bu 5–10 saniye sürebilir</p>
              </motion.div>
            ) : error || !data ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-12 text-center"
              >
                <p className="text-3xl">😔</p>
                <p className="text-sm text-white/50">Rapor oluşturulamadı.</p>
                <p className="text-xs text-white/25">Biraz daha veri toplandıktan sonra tekrar dene.</p>
              </motion.div>
            ) : (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Trend badge + summary */}
                <div className="space-y-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${trend?.bg} ${trend?.color}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    {trend?.label}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{data.summary}</p>
                </div>

                {/* Highlights */}
                {data.highlights.length > 0 && (
                  <Section icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} title="Öne Çıkanlar">
                    {data.highlights.map((h, i) => (
                      <BulletItem key={i} color="emerald" text={h} />
                    ))}
                  </Section>
                )}

                {/* Concerns */}
                {data.concerns.length > 0 && (
                  <Section icon={<AlertCircle className="w-4 h-4 text-amber-400" />} title="İyileştirme Alanları">
                    {data.concerns.map((c, i) => (
                      <BulletItem key={i} color="amber" text={c} />
                    ))}
                  </Section>
                )}

                {/* Subjects */}
                {(data.strongest_subject || data.weakest_subject) && (
                  <Section icon={<BookOpen className="w-4 h-4 text-indigo-400" />} title="Ders Analizi">
                    {data.strongest_subject && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">En Güçlü</span>
                        <span className="text-xs text-white/60">{data.strongest_subject}</span>
                      </div>
                    )}
                    {data.weakest_subject && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Odaklan</span>
                        <span className="text-xs text-white/60">{data.weakest_subject}</span>
                      </div>
                    )}
                  </Section>
                )}

                {/* Streak */}
                <Section icon={<Flame className="w-4 h-4 text-orange-400" />} title="Seri Analizi">
                  <p className="text-xs text-white/60 leading-relaxed">{data.streak_analysis}</p>
                </Section>

                {/* Recommendations */}
                {data.recommendations.length > 0 && (
                  <Section icon={<Lightbulb className="w-4 h-4 text-yellow-400" />} title="AI Önerileri">
                    {data.recommendations.map((r, i) => (
                      <BulletItem key={i} color="yellow" text={r} />
                    ))}
                  </Section>
                )}

                {/* Next week focus */}
                <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Gelecek Hafta Hedefi</p>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{data.next_week_focus}</p>
                </div>

                <p className="text-[9px] text-white/15 text-right">
                  {new Date(data.generated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-bold text-white/80">{title}</h3>
      </div>
      <div className="pl-6 space-y-1.5">{children}</div>
    </div>
  )
}

function BulletItem({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-400',
    amber:   'bg-amber-400',
    yellow:  'bg-yellow-400',
    indigo:  'bg-indigo-400',
  }
  return (
    <div className="flex items-start gap-2">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors[color] ?? 'bg-white/30'}`} />
      <p className="text-xs text-white/60 leading-relaxed">{text}</p>
    </div>
  )
}
