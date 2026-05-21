'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const stats = [
  { value: '10.000+', label: 'Öğrenci' },
  { value: '2.000.000+', label: 'Oturum' },
  { value: '4.9/5', label: 'Puan' },
  { value: '98%', label: 'Memnuniyet' },
]

const testimonials = [
  {
    name: 'Ayşe K.',
    role: 'YKS Öğrencisi',
    text: "YKS'ye 3 ay kala başladım ve planlama stresim tamamen bitti.",
    rating: 5,
    avatar: 'AK',
    avatarBg: 'from-indigo-500 to-violet-500',
  },
  {
    name: 'Mehmet A.',
    role: 'Üniversite Öğrencisi',
    text: 'Pomodoro sayesinde günde 6 saat verimli çalışabiliyorum.',
    rating: 5,
    avatar: 'MA',
    avatarBg: 'from-violet-500 to-purple-500',
  },
  {
    name: 'Zeynep T.',
    role: 'LGS Öğrencisi',
    text: '45 günlük serim var, kırmak istemiyorum!',
    rating: 5,
    avatar: 'ZT',
    avatarBg: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Burak Y.',
    role: 'KPSS Adayı',
    text: 'Hangi derste zayıf olduğumu istatistiklerle görüyorum.',
    rating: 5,
    avatar: 'BY',
    avatarBg: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Elif S.',
    role: 'Lise Öğrencisi',
    text: 'Ücretsiz plan bile ihtiyacım olan her şeyi karşılıyor.',
    rating: 5,
    avatar: 'ES',
    avatarBg: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Can D.',
    role: 'YKS Öğrencisi',
    text: 'AI koç mesajları gerçekten kişisel hissettiriyor.',
    rating: 5,
    avatar: 'CD',
    avatarBg: 'from-blue-500 to-indigo-500',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function SocialProof() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl" />
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
            Öğrenci Yorumları
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Binlerce öğrenci{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              güveniyor
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Gerçek öğrencilerin gerçek deneyimleri.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 text-center"
            >
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-white/50 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 flex flex-col gap-4 hover:border-white/[0.14] transition-colors duration-300"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/70 text-sm leading-relaxed flex-1">"{t.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-white/40 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
