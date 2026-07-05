'use client'

import { useEffect, useState } from 'react'

// Kenya-flag-styled top stripe (black / white / red / white / green)
export function KenyaFlagStripe({ thick = false }: { thick?: boolean }) {
  return (
    <div className={`ke-flag-stripe ${thick ? 'ke-flag-stripe-thick' : ''}`}>
      <span className="s1" />
      <span className="s2" />
      <span className="s3" />
      <span className="s4" />
      <span className="s5" />
    </div>
  )
}

// Hook: poll an API endpoint on an interval (default 4s) so the UI auto-refreshes
export function usePoll<T>(url: string | null, intervalMs = 4000): {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const doFetch = async () => {
    if (!url) { setLoading(false); return }
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    doFetch()
    if (!url) return
    const id = setInterval(doFetch, intervalMs)
    return () => clearInterval(id)
  }, [url, intervalMs])

  return { data, loading, error, refetch: doFetch }
}

// Format KES amounts with thousand separators
export function kes(n: number): string {
  return 'KES ' + n.toLocaleString('en-KE')
}

// Generate a fake M-Pesa ref (front-end only)
export function generateMpesaRef(): string {
  return 'TY' + Math.random().toString(36).slice(2, 12).toUpperCase()
}
