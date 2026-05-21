'use client'

import { motion } from 'framer-motion'

export default function AILoadingState({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-12 rounded-xl"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '600px 100%',
          }}
          animate={{ backgroundPosition: ['-600px 0', '600px 0'] }}
          transition={{ duration: 1.6, delay: i * 0.1, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400/50"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        <span className="text-[11px] text-white/25">AI analiz yapıyor…</span>
      </div>
    </div>
  )
}
