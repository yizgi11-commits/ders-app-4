// ─────────────────────────────────────────────────────────────────
// Note text metrics — used when creating/updating notes
//
// The rule-based summary/keypoint/flashcard/quiz generators that used
// to live here were replaced by Noetic Assist (app/api/vault/assist),
// which runs the same four actions through the real Claude client.
// ─────────────────────────────────────────────────────────────────

export function countWords(content: string): number {
  const cleaned = content.trim()
  if (!cleaned) return 0
  return cleaned.split(/\s+/).filter(Boolean).length
}

export function estimateReadingTime(content: string): number {
  const words = countWords(content)
  return Math.max(1, Math.round(words / 200))
}
