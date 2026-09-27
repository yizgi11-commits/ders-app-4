'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import AuthShell, { authInputClass, authButtonClass } from '@/components/auth/AuthShell'

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

    // Lazy-loaded: keeps supabase-js (~60 kB gz) out of the initial page bundle.
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(form)
    setYukleniyor(false)
    if (error) { setHata('E-posta veya şifre hatalı.'); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold text-dark-text">Tekrar hoş geldin.</h1>
      <p className="mt-1 text-sm text-dark-text-secondary">Hesabına giriş yap ve kaldığın yerden devam et.</p>

      <form onSubmit={handleGiris} className="mt-7 flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="E-posta adresin"
          aria-label="E-posta"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className={authInputClass}
          autoComplete="email"
        />

        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            required
            placeholder="Şifren"
            aria-label="Şifre"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className={`${authInputClass} pr-10`}
            autoComplete="current-password"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass(p => !p)}
            aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-muted hover:text-dark-text-secondary"
          >
            {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {hata && <p role="alert" className="text-sm text-danger">{hata}</p>}

        <button type="submit" disabled={yukleniyor} className={`${authButtonClass} mt-2`}>
          {yukleniyor ? <Loader2 className="size-4 animate-spin" /> : 'Giriş Yap'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-text-secondary">
        Hesabın yok mu?{' '}
        <Link href="/kayit" className="font-medium text-dark-accent hover:text-dark-text transition-colors duration-[160ms]">
          Ücretsiz kayıt ol
        </Link>
      </p>
    </AuthShell>
  )
}
