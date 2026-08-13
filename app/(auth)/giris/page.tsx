'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthLeftPanel from '@/components/auth/AuthLeftPanel'

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0 },
}

export default function GirisPage() {
  const router = useRouter()
  const [form, setForm]             = useState({ email: '', password: '' })
  const [hata, setHata]             = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [showPass, setShowPass]     = useState(false)

  async function handleGiris(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    
    // Test admin credentials check (development mode)
    if (process.env.NODE_ENV === 'development' &&
        form.email === process.env.NEXT_PUBLIC_TEST_ADMIN_EMAIL &&
        form.password === process.env.NEXT_PUBLIC_TEST_ADMIN_PASSWORD) {
      // Store test admin session in localStorage
      localStorage.setItem('test_admin_session', JSON.stringify({
        email: form.email,
        timestamp: Date.now(),
        isAdmin: true
      }))
      setYukleniyor(false)
      router.push('/dashboard')
      router.refresh()
      return
    }

    // Normal Supabase authentication
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(form)
    setYukleniyor(false)
    if (error) { setHata('E-posta veya şifre hatalı.'); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#080810] flex overflow-hidden">

      {/* ── Left visual panel (desktop only) ──────────── */}
      <div className="w-[48%] border-r border-white/[0.06] shrink-0">
        <AuthLeftPanel />
      </div>

      {/* ── Right: form panel ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">

        {/* Soft ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-violet-600/10 rounded-full blur-[60px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[380px]"
        >
          {/* Card glow border */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

          <div className="relative glass-dark rounded-2xl p-8 shadow-2xl shadow-black/60">

            {/* Mobile logo — only visible on mobile */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <span className="text-sm font-bold text-white">Noetic OS</span>
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-7"
            >
              <h1 className="text-2xl font-black text-white mb-1.5">Tekrar hoş geldin</h1>
              <p className="text-sm text-white/35">Hesabına giriş yap ve kaldığın yerden devam et.</p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
              initial="hidden"
              animate="show"
              onSubmit={handleGiris}
              className="flex flex-col gap-3"
            >
              {/* Email */}
              <motion.div variants={itemVariant} className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-indigo-400 transition-colors z-10 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="E-posta adresin"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-premium"
                  autoComplete="email"
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariant} className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-indigo-400 transition-colors z-10 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Şifren"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-premium pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </motion.div>

              {/* Error */}
              <AnimatePresence mode="wait">
                {hata && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
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
                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  {yukleniyor
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><span>Giriş Yap</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                  }
                </motion.button>
              </motion.div>
            </motion.form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[11px] text-white/25">veya</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            {/* Register link */}
            <p className="text-center text-xs text-white/30">
              Hesabın yok mu?{' '}
              <Link href="/kayit" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                Ücretsiz kayıt ol →
              </Link>
            </p>

            {/* TEST ADMIN INFO — Development Only */}
            {process.env.NODE_ENV === 'development' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 pt-5 border-t border-white/[0.06] space-y-2"
              >
                <p className="text-[10px] font-semibold text-yellow-400/60 uppercase tracking-wider">🧪 Test Modu</p>
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs text-yellow-400/80">
                    <span className="font-semibold">Email:</span> {process.env.NEXT_PUBLIC_TEST_ADMIN_EMAIL}
                  </p>
                  <p className="text-xs text-yellow-400/80">
                    <span className="font-semibold">Şifre:</span> {process.env.NEXT_PUBLIC_TEST_ADMIN_PASSWORD}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
