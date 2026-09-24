'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SubscriptionTier } from '@/lib/subscription'
import { NAV_GROUPS, isActive, initialsOf, type NavItem } from './nav'

interface Props {
  tier:     SubscriptionTier
  userName: string
}

export default function Sidebar({ tier, userName }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleCikis() {
    // Lazy-loaded: keeps supabase-js out of every dashboard page's bundle.
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.push('/giris')
    router.refresh()
  }

  function renderItem({ href, label, icon: Icon }: NavItem) {
    const active = isActive(pathname, href)
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex items-center gap-2.5 h-9 px-3 rounded-md text-base font-medium transition-colors duration-[160ms]',
          active
            ? 'bg-white/[0.09] text-dark-text'
            : 'text-dark-text-secondary hover:bg-white/[0.06] hover:text-dark-text',
        )}
      >
        {active && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent" />}
        <Icon className={cn('size-4 shrink-0', active && 'text-dark-accent')} />
        {label}
      </Link>
    )
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 self-start shrink-0 bg-dark-base border-r border-dark-border">

      {/* Logo */}
      <div className="px-5 pt-6 pb-6">
        <p className="text-md font-semibold tracking-wide text-dark-text leading-tight">NOETIC</p>
        <p className="text-[11px] text-dark-text-secondary mt-0.5">Öğrenme İşletim Sistemi</p>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[11px] font-medium tracking-[0.08em] text-dark-text-secondary">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(renderItem)}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: upgrade (free) + user */}
      <div className="px-3 py-4 border-t border-dark-border flex flex-col gap-3">
        {tier === 'free' && (
          <Link
            href="/dashboard/upgrade"
            className="flex items-center gap-2.5 h-9 px-3 rounded-md border border-dark-border text-sm font-medium text-dark-text-secondary hover:text-dark-text hover:bg-white/[0.06] transition-colors duration-[160ms]"
          >
            <Sparkles className="size-4 shrink-0 text-dark-accent" />
            Upgrade to Pro
          </Link>
        )}

        <div className="flex items-center gap-2.5 px-1">
          <div className="size-7 shrink-0 rounded-full bg-dark-secondary border border-dark-border flex items-center justify-center text-[11px] font-semibold text-dark-text">
            {initialsOf(userName)}
          </div>
          <p className="flex-1 min-w-0 truncate text-sm font-medium text-dark-text">{userName}</p>
          <button
            onClick={handleCikis}
            aria-label="Çıkış yap"
            title="Çıkış yap"
            className="p-1.5 rounded-md text-dark-text-secondary hover:text-dark-text hover:bg-white/[0.06] transition-colors duration-[160ms]"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
