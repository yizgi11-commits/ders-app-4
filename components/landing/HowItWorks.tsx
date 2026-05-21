'use client'

import { motion } from 'framer-motion'
import { UserPlus, Sparkles, Zap } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Hesabını Oluştur',
    description: '2 dakikada kaydol, hedeflerini ve derslerini gir',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Planını Al',
    description: 'AI destekli sistem sana özel haftalık program oluşturur',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Çalış & Geliş',
    description: 'Pomodoro ile çalış, XP kazan, gelişimini izle',
    gradient: 'from-purple-500 to-pink-500',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-sm text-violet-300 font-medium mb-4">
            Nasıl Çalışır?
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            3 adımda{' '}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              verimli çalışmaya başla
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Karmaşık kurulumlar yok. Dakikalar içinde kişisel çalışma sisteminizi oluşturun.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-purple-500/30" />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                className="flex flex-col items-center text-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                {/* Number + Icon circle */}
                <div className="relative mb-6">
                  {/* Large gradient number in background */}
                  <span
                    className={`absolute -top-6 -left-4 text-8xl font-black bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent opacity-10 select-none leading-none`}
                  >
                    {step.number}
                  </span>

                  {/* Icon circle */}
                  <div className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} p-0.5`}>
                    <div className="w-full h-full rounded-2xl bg-[#080810] flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Step number badge */}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-xs">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
