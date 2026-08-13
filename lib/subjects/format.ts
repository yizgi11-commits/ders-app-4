export function formatLastStudied(iso: string | null): string {
  if (!iso) return 'Not studied yet'

  const then = new Date(iso)
  const now  = new Date()
  const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))

  if (days <= 0) return 'Last studied: today'
  if (days === 1) return 'Last studied: yesterday'
  if (days < 30) return `Last studied: ${days} days ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `Last studied: ${months} month${months > 1 ? 's' : ''} ago`

  const years = Math.floor(months / 12)
  return `Last studied: ${years} year${years > 1 ? 's' : ''} ago`
}
