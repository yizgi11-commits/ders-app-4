// ─────────────────────────────────────────────────────────────────
// Level titles — shown next to the numeric level on Profile
// ("Level 7 — Kararlı Öğrenci"). Purely cosmetic, no gameplay effect.
// ─────────────────────────────────────────────────────────────────
const LEVEL_TITLES: { min: number; title: string }[] = [
  { min: 1,  title: 'Yeni Başlayan' },
  { min: 3,  title: 'Öğrenci' },
  { min: 6,  title: 'Kararlı Öğrenci' },
  { min: 10, title: 'Uzman Öğrenci' },
  { min: 15, title: 'Usta' },
  { min: 20, title: 'Bilge' },
  { min: 30, title: 'Noetic Master' },
]

export function levelTitle(level: number): string {
  let title = LEVEL_TITLES[0].title
  for (const t of LEVEL_TITLES) {
    if (level < t.min) break
    title = t.title
  }
  return title
}
