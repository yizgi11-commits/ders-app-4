export function formatLastStudied(iso: string | null): string {
  if (!iso) return 'Henüz çalışılmadı'

  const then = new Date(iso)
  const now  = new Date()
  const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))

  if (days <= 0) return 'Son çalışma: bugün'
  if (days === 1) return 'Son çalışma: dün'
  if (days < 30) return `Son çalışma: ${days} gün önce`

  const months = Math.floor(days / 30)
  if (months < 12) return `Son çalışma: ${months} ay önce`

  const years = Math.floor(months / 12)
  return `Son çalışma: ${years} yıl önce`
}
