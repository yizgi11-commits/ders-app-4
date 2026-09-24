import RecallClient from '@/components/recall/RecallClient'

export const metadata = { title: 'Recall' }

export default function RecallPage() {
  // No width cap here: the session view goes full-bleed; RecallClient caps the queue view itself.
  return <RecallClient />
}
