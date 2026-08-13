import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubjectsWithProgress, getAtlasExamName } from '@/lib/subjects/progress'

// GET /api/atlas — subjects + topics augmented with computed progress
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const [subjects, examName] = await Promise.all([
    getSubjectsWithProgress(supabase, user.id),
    getAtlasExamName(supabase, user.id),
  ])

  return NextResponse.json({ subjects, examName })
}
