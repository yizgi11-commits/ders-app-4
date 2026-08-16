import JourneyClient from '@/components/journey/JourneyClient'

export const metadata = { title: 'Journey' }

export default function JourneyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Journey</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Öğrenme geçmişin.</p>
      </div>

      <JourneyClient />
    </div>
  )
}
