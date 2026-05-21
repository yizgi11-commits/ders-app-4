import Anthropic from '@anthropic-ai/sdk'

// ─────────────────────────────────────────────────────────────────
// Singleton Anthropic client — server-side only
// ─────────────────────────────────────────────────────────────────
let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY ortam değişkeni eksik')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

// Model to use — Haiku is cheapest & fast enough for structured JSON
export const AI_MODEL = 'claude-haiku-4-5'

// Max tokens for each generation type
export const TOKEN_LIMITS = {
  daily:           600,
  weekly:          900,
  recommendations: 400,
} as const
