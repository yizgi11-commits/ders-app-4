import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/security'

// GET /api/documents?saved=1
// Lists the user's uploaded PDFs. `extracted_text` is deliberately excluded —
// it can be megabytes and the list view never renders it.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const savedOnly = new URL(req.url).searchParams.get('saved') === '1'

  let query = supabase
    .from('documents')
    .select('id, user_id, name, storage_path, size_bytes, subject_id, topic_id, is_favorite, created_at, subjects(id, name, icon, color), topics(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (savedOnly) query = query.eq('is_favorite', true)

  const { data, error } = await query
  if (error) return safeError(error, 'Belgeler alınamadı')

  return NextResponse.json({ documents: data ?? [] })
}
