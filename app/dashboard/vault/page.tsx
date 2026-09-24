import VaultClient from '@/components/vault/VaultClient'

export const metadata = { title: 'Vault' }

export default function VaultPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">Vault</h1>
        <p className="text-base text-text-secondary mt-1">Kişisel bilgi depon.</p>
      </div>

      <VaultClient />
    </div>
  )
}
