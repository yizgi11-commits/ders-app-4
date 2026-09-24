// Week math shared by the Planner header (week navigation) and the Calendar tab.
//
// Dates are formatted from LOCAL date parts. The previous helpers parsed
// "YYYY-MM-DDT00:00:00" as local time and then called toISOString(), which
// converts to UTC — east of UTC (e.g. Istanbul, UTC+3) every result slid back
// a day, so the "Mon" column actually showed Saturday.

const pad = (n: number) => String(n).padStart(2, '0')

function localIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayStr(): string {
  return localIso(new Date())
}

/** Monday of the week containing dateStr. */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return localIso(d)
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return localIso(d)
}
