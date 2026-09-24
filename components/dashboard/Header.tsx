'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { pageTitle, initialsOf } from './nav'

interface HeaderProps {
  userName: string
}

export default function Header({ userName }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 bg-surface border-b border-border flex items-center gap-3 px-4 lg:px-6">
      {/* Page title */}
      <p className="text-md font-semibold text-text truncate">{pageTitle(pathname)}</p>

      <div className="flex-1" />

      {/* Search */}
      <button
        type="button"
        className="hidden sm:flex items-center justify-between w-[140px] px-2.5 py-1 rounded-md bg-surface-subtle border border-border text-sm text-text-muted hover:border-border-strong transition-colors duration-[160ms]"
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
        className="p-2 rounded-md text-text-secondary hover:text-text hover:bg-surface-subtle transition-colors duration-[160ms]"
      >
        <Bell className="size-4" />
      </button>

      {/* Avatar */}
      <div
        title={userName}
        className="size-7 shrink-0 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[11px] font-semibold"
      >
        {initialsOf(userName)}
      </div>
    </header>
  )
}
