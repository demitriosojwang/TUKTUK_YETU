'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, WifiOff, X, RefreshCw, Wifi } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// ServiceWorkerRegister — registers the service worker on mount.
// Renders nothing visible.
// ─────────────────────────────────────────────────────────────────────────────
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') {
      // In dev, only register on localhost — and we still want it for testing
      if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) return
    }
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err)
      })
    }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// InstallPrompt — captures the `beforeinstallprompt` event and shows a
// Kenyan-flag-styled banner offering to add TUKTUK YETU to the home screen.
// ─────────────────────────────────────────────────────────────────────────────
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)
  // Lazy init — avoids calling setState inside the effect body
  const [installed, setInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const installedHandler = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  if (installed || dismissed || !deferredPrompt) return null

  const onInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl shadow-2xl overflow-hidden border border-border bg-white">
        {/* Kenya flag stripe on top */}
        <div className="flex h-1">
          <div className="flex-1 bg-black" />
          <div className="w-0.5 bg-white" />
          <div className="flex-1 bg-[#BB0000]" />
          <div className="w-0.5 bg-white" />
          <div className="flex-1 bg-[#006B3F]" />
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[#E1F0E8] flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-[#006B3F]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Install TUKTUK YETU</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Add to your home screen for quick access — works offline, no app store needed.
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onInstall} className="bg-[#006B3F] hover:bg-[#004A2B] text-white h-8 text-xs">
                  <Download className="w-3.5 h-3.5" /> Install
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDismissed(true)} className="h-8 text-xs">
                  Not now
                </Button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OfflineIndicator — shows a small banner when the network drops.
// Disappears automatically when connectivity returns.
// ─────────────────────────────────────────────────────────────────────────────
export function OfflineIndicator() {
  // Lazy init from navigator.onLine (safe on client; SSR returns true by default)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Sync initial value (avoids hydration mismatch by waiting for effect)
    const sync = () => setIsOnline(navigator.onLine)
    sync()
    const onOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      setTimeout(() => setWasOffline(false), 4000)
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (isOnline && !wasOffline) return null

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
      {isOnline ? (
        <Badge className="bg-[#006B3F] text-white hover:bg-[#006B3F] gap-1.5 shadow-lg">
          <Wifi className="w-3.5 h-3.5" /> Back online
        </Badge>
      ) : (
        <Badge className="bg-[#BB0000] text-white hover:bg-[#BB0000] gap-1.5 shadow-lg">
          <WifiOff className="w-3.5 h-3.5" /> Offline — showing cached data
        </Badge>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UpdatePrompt — when a new service worker takes over, offer a reload.
// ─────────────────────────────────────────────────────────────────────────────
export function UpdatePrompt() {
  const [needsUpdate, setNeedsUpdate] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    let reg: ServiceWorkerRegistration | null = null
    navigator.serviceWorker.getRegistration().then((r) => {
      reg = r
      if (r?.waiting) setNeedsUpdate(true)
    })
    const onUpdate = () => setNeedsUpdate(true)
    navigator.serviceWorker.addEventListener('controllerchange', onUpdate)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onUpdate)
  }, [])

  if (!needsUpdate) return null

  const reload = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) reg.waiting.postMessage('SKIP_WAITING')
      setTimeout(() => window.location.reload(), 500)
    })
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-full shadow-lg bg-white border border-border px-4 py-2 flex items-center gap-3">
        <span className="text-sm">New version available</span>
        <Button size="sm" onClick={reload} className="bg-[#006B3F] hover:bg-[#004A2B] text-white h-7 text-xs rounded-full">
          <RefreshCw className="w-3 h-3" /> Reload
        </Button>
      </div>
    </div>
  )
}
