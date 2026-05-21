'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { DailyXPStat, DailyFocusStat } from '@/lib/analytics/types'

type Tab = 'xp' | 'focus'

interface Props {
  dailyXP:    DailyXPStat[]     // last 30 days
  dailyFocus: DailyFocusStat[]  // last 30 days
}

function CustomTooltip({ active, payload, label, tab }: any) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value as number
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2.5 shadow-xl text-xs border border-white/10">
      <p className="font-bold mb-0.5">{label}</p>
      <p className="text-violet-300">
        {tab === 'xp' ? `${val} XP` : `${val} dakika`}
      </p>
    </div>
  )
}

export default function MonthlyLineChart({ dailyXP, dailyFocus }: Props) {
  const [tab, setTab] = useState<Tab>('xp')

  const data = tab === 'xp'
    ? dailyXP.map(d => ({
        label: d.date.slice(5),  // MM-DD
        value: d.xp,
      }))
    : dailyFocus.map(d => ({
        label: d.date.slice(5),
        value: d.focus_minutes,
      }))

  // Show only every 5th label to avoid crowding
  const tickFormatter = (_: string, i: number) => (i % 5 === 0 ? data[i]?.label ?? '' : '')

  const gradientId = `grad-${tab}`
  const color = tab === 'xp' ? '#8b5cf6' : '#06b6d4'
  const colorLight = tab === 'xp' ? '#ddd6fe' : '#cffafe'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.12 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">30 Günlük Trend</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Son 30 günlük gelişim grafiği</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 text-xs font-semibold">
          {(['xp', 'focus'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? 'px-2.5 py-1 rounded-md bg-white shadow-sm text-gray-900'
                  : 'px-2.5 py-1 rounded-md text-muted-foreground hover:text-gray-700'
              }
            >
              {t === 'xp' ? 'XP' : 'Odak'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color}      stopOpacity={0.18} />
              <stop offset="95%" stopColor={color}      stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tickFormatter={tickFormatter}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip tab={tab} />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
