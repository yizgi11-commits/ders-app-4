'use client'

import {
  createContext, useCallback, useContext, useRef, useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ACHIEVEMENT_MAP } from '@/lib/gamification/achievements'
import type { Achievement, GamEvent } from '@/lib/gamification/types'
import LevelUpModal from './LevelUpModal'
import AchievementToast from './AchievementToast'

// ─────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────
interface GamCtx {
  /** Call after any API response that might contain gamification data */
  notify: (opts: {
    newAchievements?: string[]   // achievement IDs
    levelUp?:         boolean
    newLevel?:        number
  }) => void
}

const GamificationContext = createContext<GamCtx>({ notify: () => {} })
export const useGamification = () => useContext(GamificationContext)

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────
export default function GamificationProvider({ children }: { children: React.ReactNode }) {
  // Queue of achievement toasts to display one by one
  const [toastQueue, setToastQueue] = useState<Achievement[]>([])
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null)
  const processingRef = useRef(false)

  const notify = useCallback(({ newAchievements = [], levelUp, newLevel }: {
    newAchievements?: string[]
    levelUp?: boolean
    newLevel?: number
  }) => {
    // Resolve achievement IDs → Achievement objects
    const achievements = newAchievements
      .map(id => ACHIEVEMENT_MAP.get(id))
      .filter(Boolean) as Achievement[]

    if (achievements.length > 0) {
      setToastQueue(prev => [...prev, ...achievements])
    }

    if (levelUp && newLevel) {
      // Small delay so XP toast shows first
      setTimeout(() => setLevelUpLevel(newLevel), 1200)
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToastQueue(prev => prev.filter(a => a.id !== id))
  }, [])

  return (
    <GamificationContext.Provider value={{ notify }}>
      {children}

      {/* Achievement Toasts — stacked from bottom-right */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col-reverse gap-3 pointer-events-none">
        <AnimatePresence mode="sync">
          {toastQueue.slice(0, 3).map((achievement, i) => (
            <AchievementToast
              key={achievement.id}
              achievement={achievement}
              index={i}
              onClose={() => dismissToast(achievement.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Level-Up Modal */}
      <AnimatePresence>
        {levelUpLevel !== null && (
          <LevelUpModal
            level={levelUpLevel}
            onClose={() => setLevelUpLevel(null)}
          />
        )}
      </AnimatePresence>
    </GamificationContext.Provider>
  )
}
