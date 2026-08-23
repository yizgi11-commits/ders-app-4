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
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Atlas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Öğrenme haritanı görsel olarak takip et.</p>
      </div>

      <AtlasTree initialSubjects={subjects} initialExamName={examName} />
    </div>
  )
}
