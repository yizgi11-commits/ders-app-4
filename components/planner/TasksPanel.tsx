'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PlannerTask } from '@/lib/planner/types'
import TaskForm from './TaskForm'
import TaskList from './TaskList'

export default function TasksPanel() {
  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const end = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      const res = await fetch(`/api/planner/tasks?start=${today}&end=${end}`)
      const data = await res.json()
      setTasks(data.tasks ?? [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-48 bg-white border border-border rounded-2xl animate-pulse" />
        <div className="h-24 bg-white border border-border rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <TaskForm onCreated={task => setTasks(prev => [...prev, task])} />
      <TaskList tasks={tasks} onChange={setTasks} />
    </div>
  )
}
