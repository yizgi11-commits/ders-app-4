'use client'

import { usePathname } from 'next/navigation'
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
