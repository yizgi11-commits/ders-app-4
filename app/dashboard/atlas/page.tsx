import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubjectsWithProgress, getAtlasExamName } from '@/lib/subjects/progress'
import AtlasTree from '@/components/atlas/AtlasTree'

export default async function AtlasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const [subjects, examName] = await Promise.all([
    getSubjectsWithProgress(supabase, user.id),
    getAtlasExamName(supabase, user.id),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">Atlas</h1>
        <p className="text-base text-text-secondary mt-1">Öğrenme haritanı görsel olarak takip et.</p>
      </div>

      <AtlasTree initialSubjects={subjects} initialExamName={examName} />
    </div>
  )
}
