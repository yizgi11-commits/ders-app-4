import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/admin/usage ──────────────────────────────────────────
// Returns token usage and cost summary for current month.
// Protected: only the app owner (yizgi11@gmail.com) can access.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check admin access
  const isOwner = user?.email === 'yizgi11@gmail.com'
  const isTestAdmin = process.env.NODE_ENV === 'development' && 
                      user?.email === process.env.NEXT_PUBLIC_TEST_ADMIN_EMAIL

  if (!user || (!isOwner && !isTestAdmin)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: rows } = await supabase
    .from('api_usage')
    .select('endpoint, model, tokens_in, tokens_out, cost_usd, created_at')
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: false })

  const list = rows ?? []

  // Aggregate totals
  const totals = list.reduce(
    (acc, r) => ({
      tokens_in:  acc.tokens_in  + (r.tokens_in  ?? 0),
      tokens_out: acc.tokens_out + (r.tokens_out ?? 0),
      cost_usd:   acc.cost_usd   + (r.cost_usd   ?? 0),
      calls:      acc.calls      + 1,
    }),
    { tokens_in: 0, tokens_out: 0, cost_usd: 0, calls: 0 },
  )

  // Per-endpoint breakdown
  const byEndpoint: Record<string, { calls: number; tokens_in: number; tokens_out: number; cost_usd: number }> = {}
  for (const r of list) {
    const ep = r.endpoint ?? 'unknown'
    if (!byEndpoint[ep]) byEndpoint[ep] = { calls: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 }
    byEndpoint[ep].calls      += 1
    byEndpoint[ep].tokens_in  += r.tokens_in  ?? 0
    byEndpoint[ep].tokens_out += r.tokens_out ?? 0
    byEndpoint[ep].cost_usd   += r.cost_usd   ?? 0
  }

  // Per-day totals (last 30 calls for sparkline)
  const recent = list.slice(0, 30).map(r => ({
    endpoint: r.endpoint,
    tokens:   (r.tokens_in ?? 0) + (r.tokens_out ?? 0),
    cost_usd: r.cost_usd,
    at:       r.created_at,
  }))

  return NextResponse.json({
    month:       monthStart.toISOString().slice(0, 7),
    total_calls: totals.calls,
    total_tokens_in:  totals.tokens_in,
    total_tokens_out: totals.tokens_out,
    total_cost_usd:   parseFloat(totals.cost_usd.toFixed(4)),
    by_endpoint: byEndpoint,
    recent,
  })
}
