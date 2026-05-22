'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthLeftPanel from '@/components/auth/AuthLeftPanel'

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0 },
}

const fields = [
  { key: 'ad',       type: 'text',     placeholder: 'Adın Soyadın',    icon: User,  autoComplete: 'name'             },
  { key: 'email',    type: 'email',    placeholder: 'E-posta adresin', icon: Mail,  autoComplete: 'email'            },
  { key: 'password', type: 'password', placeholder: 'Şifren (min. 6)', icon: Lock,  autoComplete: 'new-password'     },
] as const

const perks = [
  'Tamamen ücretsiz',
  'Kredi kartı gerekmez',
  'Saniyeler içinde kurulum',
]

export default function KayitPage() {
  const router = useRouter()
  const [form, setForm]                   = useState({ ad: '', email: '', password: '' })
  const [hata, setHata]                   = useState('')
  const [yukleniyor, setYukleniyor]       = useState(false)
  const [showPass, setShowPass]           = useState(false)
  const [emailSent, setEmailSent]         = useState(false)

  async function handleKayit(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    if (form.password.length < 6) { setHata('Şifre en az 6 karakter olmalı.'); return }
    setYukleniyor(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { ad: form.ad } },
    })
    setYukleniyor(false)
    if (error) { setHata(error.message); return }

    // If session exists → email confirmation disabled, go straight to onboarding
    if (data.session) {
      router.push('/onboarding')
      router.refresh()
    } else {
      // Email confirmation required — show confirmation message
      setEmailSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] flex overflow-hidden">

      {/* ── Left visual panel ─────────────────────────── */}
      <div className="w-[48%] border-r border-white/[0.06] shrink-0">
        <AuthLeftPanel />
      </div>

      {/* ── Right: form panel ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-[90px]" />
          <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px]" />
        </div>

        {/* Email onay ekranı */}
        {emailSent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-[380px] text-center"
          >
            <div className="glass-dark rounded-2xl p-10 shadow-2xl shadow-black/60 border border-white/[0.08]">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Mail className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">E-postanı kontrol et</h2>
              <p className="text-sm text-white/40 leading-relaxed mb-6">
                <span className="text-white/70 font-medium">{form.email}</span> adresine doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
              </p>
              <Link href="/giris" className="text-indigo-400 font-semibold hover:text-indigo-300 text-sm transition-colors">
                Giriş sayfasına git →
              </Link>
            </div>
          </motion.div>
        )}

        {!emailSent && <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[380px]"
        >
          {/* Card glow border */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

          <div className="relative glass-dark rounded-2xl p-8 shadow-2xl shadow-black/60">

            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <span className="text-sm font-bold text-white">Study OS</span>
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-7"
            >
              <h1 className="text-2xl font-black text-white mb-1.5">Hesap oluştur</h1>
              <p className="text-sm text-white/35">Ücretsiz kaydol ve hemen başla.</p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
              initial="hidden"
              animate="show"
              onSubmit={handleKayit}
              className="flex flex-col gap-3"
            >
              {fields.map(({ key, type, placeholder, icon: Icon, autoComplete }) => (
                <motion.div key={key} variants={itemVariant} className="relative group">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-indigo-400 transition-colors z-10 pointer-events-none" />
                  <input
                    type={key === 'password' && showPass ? 'text' : type}
                    required
                    placeholder={placeholder}
                    minLength={key === 'password' ? 6 : undefined}
                    autoComplete={autoComplete}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className={`input-premium ${key === 'password' ? 'pr-10' : ''}`}
                  />
                  {key === 'password' && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </motion.div>
              ))}

              {/* Error */}
              <AnimatePresence mode="wait">
                {hata && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                      ⚠️ {hata}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div variants={itemVariant}>
                <motion.button
                  type="submit"
                  disabled={yukleniyor}
                  whileHover={!yukleniyor ? { scale: 1.015, y: -1 } : {}}
                  whileTap={!yukleniyor ? { scale: 0.975 } : {}}
                  className="w-full mt-1 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-700/50 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  {yukleniyor
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><span>Kayıt Ol — Ücretsiz</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                  }
                </motion.button>
              </motion.div>
            </motion.form>

            {/* Perks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-3 mt-4 flex-wrap"
            >
              {perks.map(p => (
                <span key={p} className="flex items-center gap-1 text-[10px] text-white/25">
                  <CheckCircle2 className="w-3 h-3 text-green-500/60" />{p}
                </span>
              ))}
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[11px] text-white/25">veya</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            {/* Login link */}
            <p className="text-center text-xs text-white/30">
              Zaten hesabın var mı?{' '}
              <Link href="/giris" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                Giriş yap →
              </Link>
            </p>
          </div>
        </motion.div>}
      </div>
    </div>
  )
}
