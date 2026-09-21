// Live limit / race-condition checks against a running Noetic instance.
//
//   BASE_URL=http://localhost:3000 TEST_EMAIL=... TEST_PASSWORD=... \
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   [TEST_SUBJECT_ID=<uuid> TEST_TOPIC_ID=<uuid of a topic under that subject>] \
//   node scripts/e2e-limits.mjs
//
// Use a dedicated FREE-tier test account. The script logs in with
// supabase-js, hands the session to the server as the same chunked cookie
// @supabase/ssr uses, then fires parallel requests and checks that the
// Free caps hold. Notes it creates are deleted afterwards.
import { createClient } from '@supabase/supabase-js'

const { BASE_URL = 'http://localhost:3000', TEST_EMAIL, TEST_PASSWORD, TEST_SUBJECT_ID, TEST_TOPIC_ID } = process.env
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!TEST_EMAIL || !TEST_PASSWORD || !SB_URL || !SB_KEY) {
  console.error('Set TEST_EMAIL, TEST_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const sb = createClient(SB_URL, SB_KEY)
const { data, error } = await sb.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
if (error) { console.error('Login failed:', error.message); process.exit(1) }

// @supabase/ssr cookie: sb-<ref>-auth-token = "base64-" + base64url(session JSON), chunked at 3180 chars.
const ref    = new URL(SB_URL).hostname.split('.')[0]
const name   = `sb-${ref}-auth-token`
const value  = 'base64-' + Buffer.from(JSON.stringify(data.session)).toString('base64url')
const chunks = value.length <= 3180 ? [[name, value]]
  : Array.from({ length: Math.ceil(value.length / 3180) }, (_, i) => [`${name}.${i}`, value.slice(i * 3180, (i + 1) * 3180)])
const cookie = chunks.map(([k, v]) => `${k}=${v}`).join('; ')

const call = (path, init = {}) => fetch(BASE_URL + path, {
  ...init,
  headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: BASE_URL, ...(init.headers ?? {}) },
})
const tally = (rs) => rs.reduce((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {})
let failures = 0
const report = (ok, label, detail) => {
  if (!ok) failures++
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`)
}

// 0. Auth wiring
const me = await call('/api/subjects')
report(me.status === 200, 'Session cookie accepted', `GET /api/subjects → ${me.status}`)
if (me.status !== 200) process.exit(1)

// 1. CSRF: cross-origin mutation must be rejected before auth
const csrf = await call('/api/notes', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: '{}' })
report(csrf.status === 403, 'Cross-origin POST rejected', `→ ${csrf.status}`)

// 2. Free note cap (10) under a 15-way concurrent burst
const created = []
const burst = await Promise.all(Array.from({ length: 15 }, (_, i) =>
  call('/api/notes', { method: 'POST', body: JSON.stringify({ title: `e2e-race-${i}`, content: 'x' }) })
    .then(async (r) => { if (r.status === 201) created.push((await r.json()).id); return r })))
const { count } = await sb.from('notes').select('id', { count: 'exact', head: true }) // RLS scopes to the user
report((count ?? 0) <= 10, 'Free note cap holds under concurrency', `statuses ${JSON.stringify(tally(burst))}, notes now ${count}`)
for (const id of created) await call(`/api/notes/${id}`, { method: 'DELETE' })

// 3. Assist daily limit (10/day Free) under concurrency — needs a topic id (AI context)
if (TEST_SUBJECT_ID && TEST_TOPIC_ID) {
  const ask = () => call('/api/assist', {
    method: 'POST',
    body: JSON.stringify({ message: 'Bu konuyu özetle', pageContext: { kind: 'atlas-topic', subjectId: TEST_SUBJECT_ID, topicId: TEST_TOPIC_ID } }),
  })
  const rs = await Promise.all(Array.from({ length: 15 }, ask))
  const ok = rs.filter((r) => r.status === 200).length
  report(ok <= 10, 'Assist 10/day holds under concurrency', `statuses ${JSON.stringify(tally(rs))}`)
} else {
  console.log('⚠️ Assist race skipped — set TEST_SUBJECT_ID + TEST_TOPIC_ID to run it (spends real AI calls)')
}

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
