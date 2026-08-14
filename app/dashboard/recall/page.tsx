import RecallClient from '@/components/recall/RecallClient'

export const metadata = { title: 'Recall' }

export default function RecallPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Recall</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Unutmadan tekrar et.</p>
      </div>

      <RecallClient />
    </div>
  )
}
