// ─────────────────────────────────────────────────────────────────
// Insights — the AI commentary layer
// ─────────────────────────────────────────────────────────────────

export interface NoeticInsightData {
  headline:      string
  body:          string
  icon:          string
  generated_at:  string
  /** Daily AI quota exhausted — the deterministic summary was returned. */
  rate_limited?: boolean
  /** Claude was unavailable; body was assembled from the raw numbers. */
  fallback?:     boolean
  /** Served from this week's app_cache entry rather than freshly generated. */
  cached?:       boolean
}
