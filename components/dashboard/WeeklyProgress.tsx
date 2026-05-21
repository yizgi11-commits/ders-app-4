'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Clock, BookOpen, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stagger, fadeUp } from '@/lib/motion'

const haftaVerisi = [
  { gun: 'Pzt', saat: 3.5, hedef: 4 },
  { gun: 'Sal', saat: 4.2, hedef: 4 },
  { gun: 'Çar', saat: 2.8, hedef: 4 },
  { gun: 'Per', saat: 5.1, hedef: 4 },
  { gun: 'Cum', saat: 3.9, hedef: 4 },
  { gun: 'Cmt', saat: 1.5, hedef: 4 },
  { gun: 'Paz', saat: 0,   hedef: 4 },
]

const dersDagilimi = [
  { ders: 'Matematik', saat: 8.2, renk: 'bg-indigo-500',  yuzde: 35 },
  { ders: 'Fizik',     saat: 5.4, renk: 'bg-violet-500',  yuzde: 23 },
  { ders: 'Kimya',     saat: 4.1, renk: 'bg-blue-500',    yuzde: 17 },
  { ders: 'Türkçe',    saat: 3.8, renk: 'bg-cyan-500',    yuzde: 16 },
  { ders: 'Diğer',     saat: 2.1, renk: 'bg-gray-300',    yuzde: 9  },
]

const MAX_SAAT = 6

const ozet = [
  { label: 'Toplam Süre', deger: '21.1 saat', icon: Clock,       renk: 'text-indigo-600 bg-indigo-50' },
  { label: 'Tamamlanan',  deger: '34 görev',  icon: BookOpen,    renk: 'text-green-600  bg-green-50'  },
  { label: 'Odak Skoru',  deger: '87%',       icon: Brain,       renk: 'text-violet-600 bg-violet-50' },
  { label: 'Büyüme',      deger: '+12%',      icon: TrendingUp,  renk: 'text-amber-600  bg-amber-50'  },
]

const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

export default function WeeklyProgress() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.1 }}
      className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Haftalık İlerleme</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Bu haftanın çalışma özeti</p>
        </div>
        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
          Bu Hafta
        </span>
      </div>

      {/* Summary cards */}
      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
      >
        {ozet.map(({ label, deger, icon: Icon, renk }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            className="bg-gray-50/70 rounded-xl p-3 border border-border/70 hover:border-border transition-colors"
          >
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', renk)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-gray-900 leading-tight">{deger}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Bar chart */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Günlük Çalışma (Saat)
        </p>
        <div className="flex items-end gap-1.5 h-28">
          {haftaVerisi.map(({ gun, saat, hedef }, i) => {
            const yukseklik     = Math.round((saat  / MAX_SAAT) * 100)
            const hedefYukseklik = Math.round((hedef / MAX_SAAT) * 100)
            const bugun         = i === todayIdx

            return (
              <div key={gun} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-gray-500 h-3 flex items-end">
                  {saat > 0 ? saat.toFixed(1) : ''}
                </span>
                <div className="w-full relative flex items-end justify-center h-20">
                  {/* Target dashed line */}
                  <div
                    className="absolute w-full border-t border-dashed border-gray-200"
                    style={{ bottom: `${hedefYukseklik}%` }}
                  />
                  {/* Animated bar */}
                  <motion.div
                    className={cn(
                      'w-full rounded-t-md',
                      saat === 0
                        ? 'bg-gray-100'
                        : saat >= hedef
                        ? 'bg-indigo-500'
                        : bugun
                        ? 'bg-amber-400'
                        : 'bg-indigo-200'
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${saat === 0 ? 6 : yukseklik}%` }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.06 }}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-medium',
                  bugun ? 'text-indigo-600 font-bold' : 'text-muted-foreground'
                )}>
                  {gun}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Subject distribution */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Ders Dağılımı
        </p>
        {/* Stacked bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
          {dersDagilimi.map(({ ders, renk, yuzde }, i) => (
            <motion.div
              key={ders}
              className={cn('h-full', renk)}
              initial={{ width: 0 }}
              animate={{ width: `${yuzde}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.05 }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {dersDagilimi.map(({ ders, saat, renk, yuzde }) => (
            <div key={ders} className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full shrink-0', renk)} />
              <span className="text-xs text-gray-700 flex-1">{ders}</span>
              <span className="text-xs text-muted-foreground">{saat} saat</span>
              <span className="text-xs font-semibold text-gray-900 w-8 text-right">{yuzde}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
