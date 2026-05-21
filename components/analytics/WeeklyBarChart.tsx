'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import type { DailyFocusStat } from '@/lib/analytics/types'

const TR_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

interface Props {
  data: DailyFocusStat[]  // last 7 days
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const mins = payload[0]?.value as number
  const hrs  = Math.floor(mins / 60)
  const rem  = mins % 60
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2.5 shadow-xl text-xs border border-white/10">
      <p className="font-bold mb-0.5">{label}</p>
      <p className="text-indigo-300">
        {hrs > 0 ? `${hrs}s ` : ''}{rem}dk odak
      </p>
      <p className="text-white/50">{payload[1]?.value ?? 0} seans</p>
    </div>
  )
}

export default function WeeklyBarChart({ data }: Props) {
  const todayDow = new Date().getDay()

  const chartData = data.map((d) => {
    const dow  = new Date(d.date + 'T12:00:00').getDay()
    const isToday = dow === todayDow
    return {
      day:     TR_SHORT[dow],
      minutes: d.focus_minutes,
      sessions: d.sessions_completed,
      isToday,
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.1 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Haftalık Odak Süresi</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Son 7 günün odak dakikaları</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-lg border border-blue-100">
          Dakika
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#cbd5e1' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 8 }} />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800} animationEasing="ease-out">
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isToday ? '#6366f1' : entry.minutes > 0 ? '#a5b4fc' : '#f1f5f9'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-3 h-3 rounded-sm bg-indigo-500" />Bugün
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-3 h-3 rounded-sm bg-indigo-200" />Diğer günler
        </span>
      </div>
    </motion.div>
  )
}
