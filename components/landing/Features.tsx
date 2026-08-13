'use client'

import { motion } from 'framer-motion'
import { Sparkles, Timer, BarChart2, Trophy, BookOpen, Bell } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'Akıllı Planlama',
    description: 'Hedeflerine göre haftalık programını otomatik oluşturur',
    color: 'indigo',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    glow: 'hover:shadow-indigo-500/20',
    border: 'hover:border-indigo-500/30',
  },
  {
    icon: Timer,
    title: 'Pomodoro Zamanlayıcı',
    description: 'Odak ve mola sürelerini optimize ederek verimliliğini artırır',
    color: 'violet',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    glow: 'hover:shadow-violet-500/20',
    border: 'hover:border-violet-500/30',
  },
  {
    icon: BarChart2,
    title: 'İlerleme Takibi',
    description: 'Günlük, haftalık ve aylık gelişimini detaylı grafiklerle gösterir',
    color: 'emerald',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    glow: 'hover:shadow-emerald-500/20',
    border: 'hover:border-emerald-500/30',
  },
  {
    icon: Trophy,
    title: 'Başarım Sistemi',
    description: 'XP kazan, serileri koru ve rozetler topla',
    color: 'amber',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    glow: 'hover:shadow-amber-500/20',
    border: 'hover:border-amber-500/30',
  },
  {
    icon: BookOpen,
    title: 'Konu Analizi',
    description: 'Hangi konuda ne kadar çalışman gerektiğini akıllıca hesaplar',
    color: 'blue',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    glow: 'hover:shadow-blue-500/20',
    border: 'hover:border-blue-500/30',
  },
  {
    icon: Bell,
    title: 'Bildirim & Hatırlatma',
    description: 'Çalışma saatinde hatırlatmalar ile asla bir seans kaçırma',
    color: 'pink',
    iconBg: 'bg-pink-500/20',
    iconColor: 'text-pink-400',
    glow: 'hover:shadow-pink-500/20',
    border: 'hover:border-pink-500/30',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-sm text-indigo-300 font-medium mb-4">
            Özellikler
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tek platformda ihtiyacın olan{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              her şey
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Noetic OS, seni hedeflerine ulaştıracak tüm araçları tek bir yerde toplar.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className={`group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 transition-all duration-300 hover:shadow-lg ${feature.glow} ${feature.border} cursor-default`}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.iconBg} mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>

                {/* Text */}
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>

                {/* Hover glow overlay */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/[0.02] to-transparent" />
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
