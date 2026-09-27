'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react'
import AuthShell, { authInputClass, authButtonClass } from '@/components/auth/AuthShell'

const fields = [
  { key: 'ad',       type: 'text',     placeholder: 'Adın Soyadın',    label: 'Ad Soyad', autoComplete: 'name'         },
  { key: 'email',    type: 'email',    placeholder: 'E-posta adresin', label: 'E-posta',  autoComplete: 'email'        },
  { key: 'password', type: 'password', placeholder: 'Şifren (min. 6)', label: 'Şifre',    autoComplete: 'new-password' },
] as const

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
    // Lazy-loaded: keeps supabase-js (~60 kB gz) out of the initial page bundle.
    const { createClient } = await import('@/lib/supabase/client')
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

  // ── E-posta onay ekranı ──
  if (emailSent) {
    return (
      <AuthShell>
        <div className="text-center">
          <Mail className="size-5 text-dark-accent mx-auto" />
          <h1 className="mt-4 text-xl font-semibold text-dark-text">E-postanı kontrol et.</h1>
          <p className="mt-2 text-sm leading-6 text-dark-text-secondary">
            <span className="text-dark-text">{form.email}</span> adresine doğrulama bağlantısı gönderdik.
            Bağlantıya tıkladıktan sonra giriş yapabilirsin.
          </p>
          <Link href="/giris" className="inline-block mt-6 text-sm font-medium text-dark-accent hover:text-dark-text transition-colors duration-[160ms]">
            Giriş sayfasına git →
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold text-dark-text">Hesap oluştur.</h1>
      <p className="mt-1 text-sm text-dark-text-secondary">Ücretsiz kaydol — kredi kartı gerekmez.</p>

      <form onSubmit={handleKayit} className="mt-7 flex flex-col gap-3">
        {fields.map(({ key, type, placeholder, label, autoComplete }) => (
          <div key={key} className="relative">
            <input
              type={key === 'password' && showPass ? 'text' : type}
              required
              placeholder={placeholder}
              aria-label={label}
              minLength={key === 'password' ? 6 : undefined}
              autoComplete={autoComplete}
              value={form[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className={`${authInputClass} ${key === 'password' ? 'pr-10' : ''}`}
            />
            {key === 'password' && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-muted hover:text-dark-text-secondary"
              >
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            )}
          </div>
        ))}

        {hata && <p role="alert" className="text-sm text-danger">{hata}</p>}

        <button type="submit" disabled={yukleniyor} className={`${authButtonClass} mt-2`}>
          {yukleniyor ? <Loader2 className="size-4 animate-spin" /> : 'Hesap Oluştur'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-text-secondary">
        Zaten hesabın var mı?{' '}
        <Link href="/giris" className="font-medium text-dark-accent hover:text-dark-text transition-colors duration-[160ms]">
          Giriş yap
        </Link>
      </p>
    </AuthShell>
  )
}
