'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pageTitle, initialsOf, isDarkRoute } from './nav'

interface HeaderProps {
  userName: string
}

export default function Header({ userName }: HeaderProps) {
  const pathname = usePathname()
  const dark = isDarkRoute(pathname)

  return (
    <header className={cn(
      'sticky top-0 z-30 h-14 shrink-0 border-b flex items-center gap-3 px-4 lg:px-6',
      dark ? 'bg-dark-canvas border-dark-border' : 'bg-surface border-border',
    )}>
      {/* Page title */}
      <p className={cn('text-md font-semibold truncate', dark ? 'text-dark-text' : 'text-text')}>
        {pageTitle(pathname)}
      </p>

      <div className="flex-1" />

      {/* Search */}
      <button
        type="button"
        className={cn(
          'hidden sm:flex items-center justify-between w-[140px] px-2.5 py-1 rounded-md border text-sm transition-colors duration-[160ms]',
          dark
            ? 'bg-dark-secondary border-dark-border text-dark-text-muted hover:border-dark-text-muted'
            : 'bg-surface-subtle border-border text-text-muted hover:border-border-strong',
        )}
      >
        <span className="flex items-center gap-1.5">
          <Search className="size-3.5" />
          Ara
        </span>
        <kbd className="font-sans text-xs">⌘K</kbd>
      </button>

      {/* Notifications — no badge until there's a real count */}
      <button
        type="button"
        aria-label="Bildirimler"
        className={cn(
          'hit-area p-2 rounded-md transition-colors duration-[160ms]',
          dark
            ? 'text-dark-text-secondary hover:text-dark-text hover:bg-white/[0.06]'
            : 'text-text-secondary hover:text-text hover:bg-surface-subtle',
        )}
      >
        <Bell className="size-4" />
      </button>

      {/* Avatar */}
      <div
        title={userName}
        className={cn(
          'size-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold',
          dark ? 'bg-dark-secondary text-dark-text' : 'bg-accent-soft text-accent',
        )}
      >
        {initialsOf(userName)}
      </div>
    </header>
  )
}
