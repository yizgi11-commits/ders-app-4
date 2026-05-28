import type { SupabaseClient } from '@supabase/supabase-js'

// claude-haiku-4-5 pricing (per token)
const PRICE_IN  = 0.80  / 1_000_000  // $0.80 per 1M input tokens
const PRICE_OUT = 4.00  / 1_000_000  // $4.00 per 1M output tokens

export async function logUsage(
  supabase:  SupabaseClient,
  userId:    string,
  endpoint:  string,
  tokensIn:  number,
  tokensOut: number,
  model = 'claude-haiku-4-5',
): Promise<void> {
  const costUsd = tokensIn * PRICE_IN + tokensOut * PRICE_OUT

  // Non-blocking — don't await, failures are silent
  void supabase.from('api_usage').insert({
    user_id:   userId,
    endpoint,
    model,
    tokens_in:  tokensIn,
    tokens_out: tokensOut,
    cost_usd:   parseFloat(costUsd.toFixed(6)),
  })
}
