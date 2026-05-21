'use client'

import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Ücretsiz',
    price: '₺0',
    period: '',
    description: 'Başlamak için ihtiyacın olan her şey',
    features: ['3 ders', '7 günlük plan', 'Temel Pomodoro', 'İlerleme grafikleri'],
    cta: 'Ücretsiz Başla',
    highlight: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '₺79',
    period: '/ay',
    description: 'Ciddi öğrenciler için tam güç',
    features: [
      'Sınırsız ders',
      'AI planlama',
      'Gelişmiş istatistik',
      'Başarım sistemi',
      'Öncelikli destek',
    ],
    cta: 'Pro\'ya Geç',
    highlight: true,
    badge: 'En Popüler',
  },
  {
    name: 'Premium',
    price: '₺149',
    period: '/ay',
    description: 'Maksimum başarı için eksiksiz paket',
    features: [
      "Pro'daki her şey",
      'Kişisel AI koç',
      'Özel hedef planlaması',
      '7/24 destek',
    ],
    cta: "Premium'a Geç",
    highlight: false,
    badge: null,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-sm text-violet-300 font-medium mb-4">
            Fiyatlandırma
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Sana uygun{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              planı seç
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Ücretsiz başla, ihtiyacın arttıkça yükselt. İstediğin zaman iptal et.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 ${
                plan.highlight
                  ? 'bg-indigo-950/60 border border-indigo-500/40 shadow-xl shadow-indigo-500/10 scale-105'
                  : 'bg-white/[0.03] border border-white/[0.08]'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold shadow-lg">
                    <Zap className="w-3 h-3" />
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Header */}
              <div>
                <div className="text-white/60 text-sm font-medium mb-1">{plan.name}</div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-white/40 text-sm mb-1.5">{plan.period}</span>
                  )}
                </div>
                <p className="text-white/50 text-sm">{plan.description}</p>
              </div>

              {/* Divider */}
              <div className={`h-px ${plan.highlight ? 'bg-indigo-500/30' : 'bg-white/[0.06]'}`} />

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <CheckCircle
                      className={`w-4 h-4 shrink-0 ${
                        plan.highlight ? 'text-indigo-400' : 'text-white/40'
                      }`}
                    />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/kayit"
                className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
                    : 'bg-white/[0.06] border border-white/[0.10] text-white/80 hover:bg-white/[0.10] hover:text-white'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          className="text-center text-white/30 text-sm mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Tüm planlar KDV dahil fiyatlandırılmıştır. İstediğin zaman iptal edebilirsin.
        </motion.p>
      </div>
    </section>
  )
}
