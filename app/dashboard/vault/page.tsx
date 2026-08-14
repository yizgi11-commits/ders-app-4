import VaultClient from '@/components/vault/VaultClient'

export const metadata = { title: 'Vault' }

export default function VaultPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Vault</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kişisel bilgi depon.</p>
      </div>

      <VaultClient />
    </div>
  )
}
