"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to service document page
    router.push('/service-document')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Service Document System</h1>
        <p className="text-gray-600">Redirecting to service document...</p>
      </div>
    </div>
  )
} 