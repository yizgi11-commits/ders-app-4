'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Plus, RefreshCw, ChevronLeft, ChevronRight, Settings2, Sparkles,
} from 'lucide-react'
import type { ScheduleBlock, StudyPreferences, StudyIntensity } from '@/lib/planner/types'
import PlanSetupWizard from './PlanSetupWizard'
import DayTimeline from './DayTimeline'
import WeekOverview from './WeekOverview'

interface SubjectItem {
  id: string
  name: string
  icon: string
  color: string
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d.toISOString().split('T')[0]
}

// Skeleton
function PlannerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-gray-100 rounded-2xl border border-gray-200" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl border border-gray-200" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl border border-gray-200" />
      ))}
    </div>
  )
}

export default function PlannerClient() {
  const today = new Date().toISOString().split('T')[0]

  const [blocks, setBlocks]       = useState<ScheduleBlock[]>([])
  const [prefs, setPrefs]         = useState<StudyPreferences | null>(null)
  const [subjects, setSubjects]   = useState<SubjectItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedDate, setSelectedDate] = useState(today)
  const [weekStart, setWeekStart] = useState(getWeekStart(today))

  // ── Load blocks + prefs + subjects ──
  const loadData = useCallback(async () => {
    try {
      const [planRes, subRes] = await Promise.all([
        fetch(`/api/planner?date=${weekStart}&week=1`),
        fetch('/api/subjects'),
      ])
      const planData = await planRes.json()
      const subData  = await subRes.json()
      setBlocks(planData.blocks ?? [])
      setPrefs(planData.preferences ?? null)
      setSubjects((subData.subjects ?? []).map((s: any) => ({
        id: s.id, name: s.name, icon: s.icon, color: s.color,
      })))
    } catch {}
    finally { setLoading(false) }
  }, [weekStart])

  useEffect(() => { loadData() }, [loadData])

  // Show wizard if no blocks exist
  const hasBlocks = blocks.length > 0
  const effectiveShowWizard = showWizard || (!loading && !hasBlocks)

  // ── Generate schedule ──
  async function handleGenerate(genPrefs: {
    daily_study_mins: number
    intensity: StudyIntensity
    start_hour: number
    subject_priorities: string[]
    weak_subjects: string[]
    week: boolean
  }) {
    setGenerating(true)
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: genPrefs.week ? weekStart : selectedDate,
          week: genPrefs.week,
          daily_study_mins: genPrefs.daily_study_mins,
          intensity: genPrefs.intensity,
          start_hour: genPrefs.start_hour,
          subject_priorities: genPrefs.subject_priorities,
          weak_subjects: genPrefs.weak_subjects,
        }),
      })
      const data = await res.json()
      setBlocks(data.blocks ?? [])
      setShowWizard(false)
      loadData()
    } catch {}
    finally { setGenerating(false) }
  }

  // ── Update block status ──
  async function handleStatusChange(id: string, status: 'completed' | 'skipped' | 'pending') {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    try {
      await fetch('/api/planner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
    } catch {
      loadData()
    }
  }

  // ── Week navigation ──
  function navigateWeek(dir: -1 | 1) {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + dir * 7)
    const newStart = d.toISOString().split('T')[0]
    setWeekStart(newStart)
    setSelectedDate(newStart)
    setLoading(true)
  }

  // Blocks for selected date
  const dayBlocks = blocks.filter(b => b.date === selectedDate)

  // Overall week stats
  const studyBlocks = blocks.filter(b => b.block_type !== 'break')
  const totalCompleted = studyBlocks.filter(b => b.status === 'completed').length
  const totalBlocks = studyBlocks.length

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            Çalışma Planı
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
            Haftalık programını oluştur ve takip et.
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI ile optimize edildi
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Week navigation */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-sm">
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateWeek(-1)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </motion.button>
            <span className="text-xs text-gray-700 font-semibold px-2 min-w-[100px] text-center">
              {formatWeekRange(weekStart)}
            </span>
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateWeek(1)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </motion.button>
          </div>

          {hasBlocks && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowWizard(true)}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"
              title="Yeniden Oluştur"
            >
              <Settings2 className="w-4 h-4 text-gray-500" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Week stats bar */}
      {hasBlocks && !effectiveShowWizard && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl px-5 py-3"
        >
          <div className="flex-1">
            <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: totalBlocks > 0 ? `${(totalCompleted / totalBlocks) * 100}%` : '0%' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {totalCompleted}/{totalBlocks} blok tamamlandı
          </span>
          {prefs && (
            <span className="text-[10px] text-gray-400">
              {prefs.intensity === 'light' ? '🌿' : prefs.intensity === 'intense' ? '🔥' : '⚡'} {prefs.daily_study_mins}dk/gün
            </span>
          )}
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PlannerSkeleton />
          </motion.div>
        ) : effectiveShowWizard ? (
          <PlanSetupWizard
            key="wizard"
            subjects={subjects}
            existingPrefs={prefs}
            onGenerate={handleGenerate}
            onCancel={() => setShowWizard(false)}
            loading={generating}
          />
        ) : (
          <motion.div
            key="schedule"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <WeekOverview
              blocks={blocks}
              weekStart={weekStart}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <DayTimeline
              date={selectedDate}
              blocks={dayBlocks}
              onStatusChange={handleStatusChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const sDay = start.getDate()
  const eDay = end.getDate()
  const sMonth = months[start.getMonth()]
  const eMonth = months[end.getMonth()]
  if (sMonth === eMonth) {
    return `${sDay} – ${eDay} ${sMonth}`
  }
  return `${sDay} ${sMonth} – ${eDay} ${eMonth}`
}
