'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Flame, Zap, BarChart2, CheckCircle2, Timer } from 'lucide-react'

// Stagger helper
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-16 overflow-hidden">

      {/* ── Ambient orbs ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-indigo-600/12 rounded-full blur-[100px] animate-orb-drift" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] animate-orb-drift" style={{ animationDelay: '-9s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-indigo-900/15 rounded-full blur-[80px]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
      </div>

      {/* ── Content ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="mb-7">
          <span className="inline-flex items-center gap-2 bg-white/[0.07] border border-white/[0.1] rounded-full px-4 py-1.5 text-xs font-medium text-white/65">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Tamamen ücretsiz · Kredi kartı gerekmez
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-5xl sm:text-6xl lg:text-[76px] font-black text-white leading-[1.04] tracking-tight mb-6"
        >
          Bugün ne çalışacağını
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
            düşünme.
          </span>
        </motion.h1>

        <motion.p variants={fadeUp} className="text-lg sm:text-xl text-white/40 max-w-2xl leading-relaxed mb-10">
          Study OS, çalışma alışkanlığını otomatik planlayan, ilerlemenizi takip eden
          ve seni motive eden akıllı bir üretkenlik platformu.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-3 mb-14">
          <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/kayit"
              className="group relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-8 py-4 rounded-xl text-sm shadow-2xl shadow-indigo-900/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              Ücretsiz Başla
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
          <Link
            href="/giris"
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors px-4 py-4"
          >
            Zaten hesabım var →
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-6 sm:gap-10 mb-16"
        >
          {[
            { num: '10K+', label: 'Aktif Öğrenci' },
            { num: '2M+', label: 'Tamamlanan Oturum' },
            { num: '4.9★', label: 'Kullanıcı Puanı' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl sm:text-2xl font-black text-white">{s.num}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 } } }}
          className="relative w-full max-w-3xl"
        >
          {/* Glow behind mockup */}
          <div className="absolute -inset-4 bg-gradient-to-b from-indigo-600/20 to-violet-600/10 rounded-3xl blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-transparent to-transparent z-10 rounded-2xl pointer-events-none" style={{ bottom: 0, height: '40%', top: 'auto' }} />

          {/* Browser chrome */}
          <div className="relative rounded-2xl border border-white/[0.10] overflow-hidden shadow-2xl shadow-black/60 bg-[#0d0d18]">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07] bg-[#0a0a15]">
              <div className="flex gap-1.5">
                {['bg-red-500/70', 'bg-yellow-500/70', 'bg-green-500/70'].map(c => (
                  <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                ))}
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white/[0.06] rounded-lg px-8 py-1 text-[10px] text-white/25">
                  studyos.app/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="flex h-[340px] sm:h-[420px]">
              {/* Sidebar */}
              <div className="w-14 sm:w-48 border-r border-white/[0.06] p-2 sm:p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2.5 px-2 py-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span className="hidden sm:block text-[11px] font-bold text-white/70">Study OS</span>
                </div>
                {[
                  { icon: '⊞', label: 'Genel Bakış', active: true },
                  { icon: '⏱', label: 'Pomodoro' },
                  { icon: '📚', label: 'Derslerim' },
                  { icon: '📅', label: 'Plan' },
                  { icon: '📊', label: 'İstatistik' },
                  { icon: '🏆', label: 'Başarımlar' },
                ].map(item => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] ${item.active ? 'bg-white/[0.09] text-white' : 'text-white/25'}`}
                  >
                    <span className="text-sm w-4 text-center">{item.icon}</span>
                    <span className="hidden sm:block">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-4 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-3 w-32 bg-white/10 rounded-md mb-1.5" />
                    <div className="h-2 w-20 bg-white/[0.05] rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-20 bg-indigo-500/20 border border-indigo-500/30 rounded-lg" />
                    <div className="h-7 w-7 bg-white/[0.06] rounded-lg" />
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { color: 'indigo', icon: Flame, v: '12', l: 'Gün Seri' },
                    { color: 'violet', icon: Zap,   v: '2840', l: 'Toplam XP' },
                    { color: 'emerald',icon: CheckCircle2, v: '%87', l: 'Görev Oranı' },
                  ].map(({ color, icon: Icon, v, l }) => (
                    <div key={l} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-2.5`}>
                      <Icon className={`w-3 h-3 text-${color}-400 mb-1.5`} />
                      <p className="text-sm font-black text-white">{v}</p>
                      <p className="text-[9px] text-white/30">{l}</p>
                    </div>
                  ))}
                </div>

                {/* Task list */}
                <div className="space-y-1.5 mb-3">
                  {[
                    { done: true,  text: 'Türev konusu tekrar', color: 'indigo' },
                    { done: true,  text: 'TYT deneme çözümü',   color: 'violet' },
                    { done: false, text: 'Geometri soru bankası', color: 'emerald' },
                    { done: false, text: 'İngilizce kelime çalış', color: 'amber' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${t.done ? `bg-${t.color}-500 border-${t.color}-500` : `border-white/20`} shrink-0`}>
                        {t.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-[11px] ${t.done ? 'line-through text-white/20' : 'text-white/60'}`}>{t.text}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
                    <span>Haftalık İlerleme</span>
                    <span>68%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full w-[68%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-4 sm:-right-8 top-8 z-20 bg-[#0d0d18] border border-white/[0.12] rounded-xl p-3 shadow-2xl shadow-black/60 hidden sm:block"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Timer className="w-3 h-3 text-violet-400" />
              </div>
              <span className="text-[11px] font-bold text-white/70">Pomodoro</span>
            </div>
            <p className="text-2xl font-black text-white">24:00</p>
            <p className="text-[9px] text-white/25 mt-1">Odak seansı — 6/8</p>
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -left-4 sm:-left-8 bottom-16 z-20 bg-[#0d0d18] border border-white/[0.12] rounded-xl p-3 shadow-2xl shadow-black/60 hidden sm:block"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">🏆</span>
              <span className="text-[10px] font-bold text-amber-400">Yeni Başarım!</span>
            </div>
            <p className="text-[11px] text-white/60">7 günlük seri tamamlandı</p>
            <p className="text-[10px] text-indigo-400 mt-1">+200 XP kazandın!</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
