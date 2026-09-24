import {
  LayoutDashboard, CalendarDays, BarChart2, Settings, Timer,
  Brain, Map, Archive, Milestone, User,
  type LucideIcon,
} from 'lucide-react'

// Single source for the app shell's navigation — Sidebar, MobileNav and
// the Header's page title all read from here.

export interface NavItem {
  href:  string
  label: string
  icon:  LucideIcon
}

export interface NavGroup {
  /** Already uppercase — CSS `uppercase` under lang="tr" turns i into İ. */
  label: string
  items: NavItem[]
}

const commandCenter: NavItem = { href: '/dashboard',          label: 'Command Center', icon: LayoutDashboard }
const focus:         NavItem = { href: '/dashboard/focus',    label: 'Focus',          icon: Timer }
const atlas:         NavItem = { href: '/dashboard/atlas',    label: 'Atlas',          icon: Map }
const planner:       NavItem = { href: '/dashboard/planner',  label: 'Planner',        icon: CalendarDays }
const vault:         NavItem = { href: '/dashboard/vault',    label: 'Vault',          icon: Archive }
const recall:        NavItem = { href: '/dashboard/recall',   label: 'Recall',         icon: Brain }
const journey:       NavItem = { href: '/dashboard/journey',  label: 'Journey',        icon: Milestone }
const insights:      NavItem = { href: '/dashboard/insights', label: 'Insights',       icon: BarChart2 }
const profile:       NavItem = { href: '/dashboard/profile',  label: 'Profile',        icon: User }
const settings:      NavItem = { href: '/dashboard/settings', label: 'Settings',       icon: Settings }

export const NAV_GROUPS: NavGroup[] = [
  { label: 'WORKSPACE', items: [commandCenter, focus, atlas, planner] },
  { label: 'LEARNING',  items: [vault, recall, journey, insights] },
  { label: 'ACCOUNT',   items: [profile, settings] },
]

/** Mobile bottom bar — the fifth slot is "More", which opens a sheet with the rest. */
export const MOBILE_PRIMARY: NavItem[] = [
  { ...commandCenter, label: 'Home' },
  focus,
  planner,
  recall,
]

export const MOBILE_MORE: NavItem[] = [atlas, vault, journey, insights, profile, settings]

/** Command Center matches only itself; every other item also owns its sub-pages. */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Pages that render on the dark canvas — the header and mobile tab bar switch to dark there too. */
export function isDarkRoute(pathname: string): boolean {
  return isActive(pathname, '/dashboard/focus')
}

const EXTRA_TITLES: { href: string; label: string }[] = [
  { href: '/dashboard/insights/weekly-review', label: 'Weekly Review' },
  { href: '/dashboard/upgrade',                label: 'Upgrade' },
]

/** Current page name for the header — longest matching route wins. */
export function pageTitle(pathname: string): string {
  const candidates = [...EXTRA_TITLES, ...NAV_GROUPS.flatMap(g => g.items)]
  let best: { href: string; label: string } | null = null
  for (const c of candidates) {
    if (isActive(pathname, c.href) && (!best || c.href.length > best.href.length)) best = c
  }
  return best?.label ?? 'Noetic'
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
