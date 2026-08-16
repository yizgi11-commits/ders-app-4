'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, X, Loader2, TrendingUp, TrendingDown, Minus,
  Sparkles, AlertTriangle, ArrowRight, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WeeklyReport } from '@/lib/ai/types'

const TREND_CONFIG = {
  improving: { label: 'Yükselişte', icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  stable:    { label: 'Stabil',     icon: Minus,         color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200' },
  declining: { label: 'Düşüşte',    icon: TrendingDown,  color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' },
} as const

export default function WeeklyReportButton() {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [report, setReport]   = useState<WeeklyReport | null>(null)
  const [error, setError]     = useState(false)

  async function handleOpen() {
    setOpen(true)
    if (report) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/insights/weekly-report')
      if (!res.ok) throw new Error()
      setReport(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 bg-white border border-border hover:bg-gray-50 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
      >
        <FileText className="w-4 h-4 text-indigo-500" />
        Haftalık Rapor Oluştur
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-border z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">Haftalık Rapor</h2>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {loading && (
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <p className="text-sm">Rapor hazırlanıyor…</p>
                  </div>
                )}

                {!loading && error && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                    <p className="text-sm text-muted-foreground">Rapor oluşturulamadı. Tekrar dene.</p>
                    <button
                      onClick={handleOpen}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Tekrar dene
                    </button>
                  </div>
                )}

                {!loading && !error && report && (
                  <div className="space-y-5">
                    {/* Trend badge */}
                    {(() => {
                      const t = TREND_CONFIG[report.productivity_trend]
                      return (
                        <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border', t.bg, t.border, t.color)}>
                          <t.icon className="w-3.5 h-3.5" /> {t.label}
                        </span>
                      )
                    })()}

                    {/* Summary */}
                    <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>

                    {/* Highlights */}
                    {report.highlights.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" /> Öne Çıkanlar
                        </p>
                        <ul className="space-y-1.5">
                          {report.highlights.map((h, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span> {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Concerns */}
                    {report.concerns.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" /> Dikkat Edilecekler
                        </p>
                        <ul className="space-y-1.5">
                          {report.concerns.map((c, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Subjects */}
                    {(report.strongest_subject || report.weakest_subject) && (
                      <div className="grid grid-cols-2 gap-2">
                        {report.strongest_subject && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">En Güçlü</p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{report.strongest_subject}</p>
                          </div>
                        )}
                        {report.weakest_subject && (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Geliştirilmeli</p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{report.weakest_subject}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Streak analysis */}
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-2.5">
                      <Flame className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700">{report.streak_analysis}</p>
                    </div>

                    {/* Next week focus */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5">
                      <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Gelecek Hafta</p>
                        <p className="text-sm text-gray-700">{report.next_week_focus}</p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {report.recommendations.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Öneriler</p>
                        <ul className="space-y-1.5">
                          {report.recommendations.map((r, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-indigo-500 mt-0.5">{i + 1}.</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
