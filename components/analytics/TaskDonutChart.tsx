'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import type { DailyTaskStat } from '@/lib/analytics/types'

interface Props { dailyTasks: DailyTaskStat[] }  // last 30 days

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2 shadow-xl text-xs border border-white/10">
      <p className="font-bold">{payload[0].name}</p>
      <p className="text-indigo-300">{payload[0].value} görev</p>
    </div>
  )
}

export default function TaskDonutChart({ dailyTasks }: Props) {
  const completed   = dailyTasks.reduce((s, d) => s + d.completed, 0)
  const total       = dailyTasks.reduce((s, d) => s + d.total, 0)
  const incomplete  = total - completed
  const rate        = total > 0 ? Math.round((completed / total) * 100) : 0

  const chartData = [
    { name: 'Tamamlandı', value: completed, color: '#6366f1' },
    { name: 'Eksik',      value: incomplete, color: '#f1f5f9' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.14 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Görev Tamamlama</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Son 30 gün</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={36} outerRadius={50}
                startAngle={90} endAngle={-270}
                dataKey="value"
                strokeWidth={0}
                isAnimationActive
                animationBegin={200}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl font-black text-gray-900"
            >
              {rate}%
            </motion.p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          {[
            { label: 'Tamamlandı', value: completed, color: 'bg-indigo-400' },
            { label: 'Toplam',     value: total,     color: 'bg-gray-200'   },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className={`w-2 h-2 rounded-full ${color}`} />{label}
                </span>
                <span className="font-bold text-gray-900">{value}</span>
              </div>
            </div>
          ))}
          <div className="pt-1 border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              Tamamlama oranı:{' '}
              <span className="font-bold text-indigo-600">{rate}%</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
