import { Suspense } from 'react'
import SharedDocumentContent from './SharedDocumentContent'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SharedServiceDocument({ params }: Props) {
  // Validate the token parameter
  const resolvedParams = await params
  const token = resolvedParams?.token
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token')
  }

  return (
    <div className="min-h-screen bg-brand-dark-bg text-brand-text-primary font-sans p-4 sm:p-8 print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <SharedDocumentContent token={token} />
        </Suspense>
      </div>
    </div>
  )
} 