import AtlasTree from '@/components/atlas/AtlasTree'

export default function AtlasPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Atlas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Öğrenme haritanı görsel olarak takip et.</p>
      </div>

      <AtlasTree />
    </div>
  )
}
