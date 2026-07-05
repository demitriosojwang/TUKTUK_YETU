'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { KenyaFlagStripe, usePoll, kes } from './shared'
import {
  Bus, Battery, Target, Users, Wallet, MapPin, CheckCircle2, LogOut,
  AlertCircle, Coins, Zap, Bell, User, Navigation, ChevronRight
} from 'lucide-react'
import { Logo } from './Logo'

type Stage = { id: string; name: string; isLandmark: boolean; fareFromBase: number; order: number }
type Passenger = {
  id: string
  phone: string
  name: string | null
  paxCount: number
  fare: number
  status: 'onboard' | 'alighted'
  paymentStatus: 'pending' | 'paid' | 'failed'
  paymentMethod: string
  mpesaRef: string | null
  boardedAt: string
  destination: Stage
}
type VehiclePayload = {
  id: string
  plate: string
  model: string
  batteryPct: number
  status: string
  region: { id: string; name: string; city: string }
  sacco: { id: string; name: string; shortName: string | null; phone: string | null } | null
  driver: { id: string; name: string; rating: number; phone: string } | null
  route: { id: string; name: string; description: string | null; baseFare: number; stages: Stage[] } | null
  activeTrip: {
    id: string
    startedAt: string
    passengers: Passenger[]
  } | null
  revenueToday: number
  loanOutstanding: number
  weeklyRepayment: number
  purchasePrice: number
}

export function DriverView() {
  const [plate, setPlate] = useState('KDB 112T')
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  // Poll vehicle data every 3s once unlocked
  const { data: vehicle, loading, refetch } = usePoll<VehiclePayload>(
    unlocked && plate ? `/api/tuktuk-yetu/vehicle?plate=${encodeURIComponent(plate)}` : null,
    3000,
  )

  const passengers = useMemo(() => vehicle?.activeTrip?.passengers ?? [], [vehicle])
  const onboard = passengers.filter((p) => p.status === 'onboard')
  const pendingCash = onboard.filter((p) => p.paymentStatus === 'pending' && p.paymentMethod === 'cash')
  const paid = onboard.filter((p) => p.paymentStatus === 'paid')
  const revenue = passengers.filter((p) => p.paymentStatus === 'paid').reduce((s, p) => s + p.fare, 0)

  async function login() {
    setPinError(null)
    // Simple PIN demo — driver pins are 1122, 2233, 3344 (or any for KDB 112T demo)
    if (pin.length < 4) { setPinError('Enter your 4-digit PIN'); return }
    setUnlocked(true)
  }

  async function alightPassenger(id: string) {
    await fetch('/api/tuktuk-yetu/passenger/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerTripId: id, action: 'alight' }),
    })
    refetch()
  }

  async function confirmCash(id: string) {
    await fetch('/api/tuktuk-yetu/passenger/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerTripId: id, action: 'confirmCash' }),
    })
    refetch()
  }

  async function updateBattery(v: number) {
    if (!vehicle) return
    await fetch('/api/tuktuk-yetu/vehicle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate: vehicle.plate, batteryPct: v }),
    })
    refetch()
  }

  // ===== Login screen =====
  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto">
        <KenyaFlagStripe thick />
        <Card className="rounded-t-none border-t-0 shadow-lg">
          <div className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Logo size="lg" />
              </div>
              <div>
                <div className="font-bold text-xl">Driver sign in</div>
                <div className="text-xs text-muted-foreground">Drive and let the system handle fares</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Your tuk tuk plate</label>
                <Input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="KDB 112T"
                  className="font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Driver PIN</label>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login()}
                  placeholder="••••"
                  maxLength={4}
                  className="font-mono text-center text-lg tracking-widest"
                />
              </div>
              {pinError && <p className="text-sm text-[#BB0000]">{pinError}</p>}
              <Button onClick={login} className="w-full bg-[#006B3F] hover:bg-[#004A2B] text-white h-12">
                Start driving →
              </Button>
            </div>

            <div className="rounded-lg bg-[#FBF1D6] border-l-4 border-[#C8A951] p-3 text-xs text-[#7A5E1A]">
              <strong>Demo PINs (Nairobi):</strong> 1122 (KDB 112T · James Mwangi), 2233 (KDB 246T · Aisha Wanjiru).<br />
              <strong>Demo PINs (Mombasa):</strong> 4455 (KMD 220A · Ervin Mmaitsi · LITOD), 5566 (KMD 481B · Dennis Njeru).
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (loading && !vehicle) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-muted-foreground">
        Loading driver dashboard...
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <AlertCircle className="w-10 h-10 mx-auto text-[#BB0000]" />
        <p>Could not load vehicle. Check the plate number.</p>
        <Button variant="outline" onClick={() => setUnlocked(false)}>← Back to sign in</Button>
      </div>
    )
  }

  // ===== Driver dashboard =====
  return (
    <div className="max-w-md mx-auto space-y-4">
      <KenyaFlagStripe thick />

      {/* Hero — Kenya flag colored dark card */}
      <Card className="rounded-t-none border-t-0 overflow-hidden">
        <div className="ke-gradient-hero p-5 relative">
          {/* Tri-color top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-black" />
            <div className="flex-1 bg-[#BB0000]" />
            <div className="flex-1 bg-[#006B3F]" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#C8A951] font-semibold">Driver dashboard</div>
              <div className="font-bold text-lg">{vehicle.plate}</div>
              <div className="text-xs text-white/70">{vehicle.driver?.name} · {vehicle.route?.name}</div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/90">
                  <MapPin className="w-3 h-3" /> {vehicle.region.name}
                </span>
                {vehicle.sacco && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#C8A951]/20 text-[#C8A951]">
                    {vehicle.sacco.shortName ?? vehicle.sacco.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setUnlocked(false)}
              className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 inline-flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" /> Sign out
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <HeroStat label="Trips" value={String(passengers.length)} />
            <HeroStat label="Revenue" value={kes(revenue).replace('KES ', 'KSh ')} />
            <HeroStat label="On board" value={String(onboard.length)} />
          </div>

          {/* Battery */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/70 inline-flex items-center gap-1">
                <Battery className="w-3.5 h-3.5" /> Battery
              </span>
              <span className="text-[#C8A951] font-semibold">{vehicle.batteryPct}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${vehicle.batteryPct}%`,
                  background: vehicle.batteryPct < 20 ? '#BB0000' : vehicle.batteryPct < 40 ? '#C8A951' : 'linear-gradient(to right, #006B3F, #C8A951)',
                }}
              />
            </div>
            <div className="text-[10px] text-white/60 text-right">~{Math.round(vehicle.batteryPct * 0.75)} km range left</div>
          </div>
        </div>
      </Card>

      {/* Hands-free banner */}
      <div className="rounded-lg bg-[#E1F0E8] border-l-4 border-[#006B3F] p-3 flex items-start gap-2.5">
        <Zap className="w-4 h-4 text-[#006B3F] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#004A2B]">
          <strong>Hands-free mode active.</strong> Passengers pick their stage and pay via M-Pesa themselves.
          You get an alert here the moment payment lands — just drive and drop them off at their stage.
        </div>
      </div>

      {/* Cash confirmation requests */}
      {pendingCash.length > 0 && (
        <Card className="border-[#C8A951] bg-[#FBF1D6]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-[#7A5E1A]" />
              <div className="font-semibold text-[#7A5E1A] text-sm">Cash payments to confirm</div>
              <Badge className="bg-[#C8A951] text-white ml-auto">{pendingCash.length}</Badge>
            </div>
            <div className="space-y-2">
              {pendingCash.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-2.5">
                  <div>
                    <div className="text-sm font-medium">{p.destination.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.name || 'Walk-in'} · {p.paxCount} pax · {kes(p.fare)}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => confirmCash(p.id)} className="bg-[#006B3F] hover:bg-[#004A2B] text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Got cash
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Passenger manifest */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="font-semibold text-sm inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#006B3F]" /> Passengers on board
          </div>
          <Badge variant="outline" className="bg-[#E1F0E8] text-[#004A2B] border-[#006B3F]/30">
            {onboard.length} riding
          </Badge>
        </div>

        {onboard.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40" />
            No passengers on board yet. Once a passenger boards and pays, they appear here automatically.
          </Card>
        ) : (
          <div className="space-y-2">
            {onboard
              .slice()
              .sort((a, b) => a.destination.order - b.destination.order)
              .map((p) => (
                <Card key={p.id} className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Stage number badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                      p.destination.isLandmark ? 'bg-[#FBF1D6] text-[#7A5E1A]' : 'bg-[#E1F0E8] text-[#004A2B]'
                    }`}>
                      {p.destination.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate flex items-center gap-1.5">
                            {p.destination.name}
                            {p.destination.isLandmark && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-[#FBF1D6] text-[#7A5E1A] border-[#C8A951]/40">
                                landmark
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {p.name || 'Walk-in'} · {p.paxCount} pax · {kes(p.fare)}
                          </div>
                        </div>
                        <PaymentBadge method={p.paymentMethod} status={p.paymentStatus} ref={p.mpesaRef} />
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t">
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          Drop at stage #{p.destination.order}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => alightPassenger(p.id)}
                          className="h-7 text-xs border-[#006B3F]/40 text-[#006B3F] hover:bg-[#E1F0E8]"
                        >
                          <LogOut className="w-3 h-3" /> Alighted
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Today's revenue summary */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-[#006B3F]" />
          <div className="font-semibold text-sm">Today&apos;s earnings</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#E1F0E8] p-3">
            <div className="text-xs text-[#004A2B]/70">Total revenue</div>
            <div className="text-xl font-bold text-[#004A2B]">{kes(revenue)}</div>
          </div>
          <div className="rounded-lg bg-[#FBF1D6] p-3">
            <div className="text-xs text-[#7A5E1A]/70">Trips completed</div>
            <div className="text-xl font-bold text-[#7A5E1A]">{passengers.length - onboard.length}</div>
          </div>
        </div>
      </Card>

      <div className="text-center text-xs text-muted-foreground pt-2">
        <strong className="text-[#004A2B]">TUKTUK YETU</strong> · Powered by Kenyan colours · Black, Red, Green &amp; White
      </div>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-center">
      <div className="text-base font-bold text-white truncate">{value}</div>
      <div className="text-[10px] text-[#C8A951] mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  )
}

function PaymentBadge({ method, status, ref }: { method: string; status: string; ref: string | null }) {
  if (status === 'paid') {
    if (method === 'cash') {
      return (
        <Badge className="bg-[#FBF1D6] text-[#7A5E1A] hover:bg-[#FBF1D6]">
          <Coins className="w-3 h-3 mr-1" /> Cash
        </Badge>
      )
    }
    return (
      <Badge className="bg-[#006B3F] text-white hover:bg-[#006B3F]">
        <CheckCircle2 className="w-3 h-3 mr-1" /> {method.toUpperCase()}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-[#FCE4E4] text-[#8C0000] border-[#BB0000]/30">
      <AlertCircle className="w-3 h-3 mr-1" /> Pending
    </Badge>
  )
}
