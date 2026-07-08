'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KenyaFlagStripe, kes } from './shared'
import { LogoLockup } from './Logo'
import { MapPin, Phone, Loader2, CheckCircle2, QrCode, Zap, Star, Shield, Coins, Smartphone, ChevronRight } from 'lucide-react'

type Stage = {
  id: string
  name: string
  isLandmark: boolean
  fareFromBase: number
  order: number
}

type PassengerPayload = {
  plate: string
  model: string
  isElectric: boolean
  batteryPct: number
  region: { id: string; name: string; city: string }
  sacco: { name: string; shortName: string | null } | null
  driver: { name: string; rating: number } | null
  route: {
    id: string
    name: string
    description: string | null
    baseFare: number
    stages: Stage[]
  } | null
  activeTripId: string | null
}

type Steps = 'enter' | 'stage' | 'pay' | 'processing' | 'confirmed'

export function PassengerView() {
  const [plate, setPlate] = useState('')
  const [vehicle, setVehicle] = useState<PassengerPayload | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingVehicle, setLoadingVehicle] = useState(false)

  const [step, setStep] = useState<Steps>('enter')
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [paxCount, setPaxCount] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash' | 'nfc' | 'qr'>('mpesa')
  const [confirmation, setConfirmation] = useState<{ fare: number; mpesaRef: string | null; destination: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function lookupVehicle() {
    setLoadError(null)
    const p = plate.trim().toUpperCase().replace(/\s+/g, ' ')
    if (!p) { setLoadError('Enter the tuk tuk plate number (e.g. KDB 112T)'); return }
    setLoadingVehicle(true)
    try {
      const res = await fetch(`/api/tuktuk-yetu/passenger?plate=${encodeURIComponent(p)}`, { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setLoadError(data.error || `Lookup failed (${res.status})`)
        return
      }
      const data: PassengerPayload = await res.json()
      if (!data.route) { setLoadError('This vehicle has no route assigned yet.'); return }
      setVehicle(data)
      setStep('stage')
    } catch {
      setLoadError('Network error. Try again.')
    } finally {
      setLoadingVehicle(false)
    }
  }

  async function submitPayment() {
    if (!vehicle || !selectedStage) return
    if (paymentMethod === 'mpesa' && phone.length < 10) {
      setLoadError('Enter your M-Pesa phone number (e.g. 0722123456)')
      return
    }
    setLoadError(null)
    setSubmitting(true)
    setStep('processing')

    try {
      const res = await fetch('/api/tuktuk-yetu/passenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: vehicle.plate,
          phone: phone || '0000000000',
          name: name || undefined,
          destinationStageId: selectedStage.id,
          paxCount,
          paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStep('pay')
        setLoadError(data.error || 'Payment failed. Try again.')
        return
      }
      setConfirmation({
        fare: data.passengerTrip.fare,
        mpesaRef: data.passengerTrip.mpesaRef,
        destination: data.passengerTrip.destination.name,
      })
      setStep('confirmed')
    } catch {
      setStep('pay')
      setLoadError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetAll() {
    setVehicle(null); setSelectedStage(null); setPhone(''); setName(''); setPaxCount(1); setConfirmation(null); setStep('enter')
  }

  return (
    <div className="max-w-md mx-auto">
      <KenyaFlagStripe thick />
      <Card className="rounded-t-none border-t-0 shadow-lg">
        {/* Header */}
        <div className="p-5 pb-3 border-b">
          <div className="flex items-center gap-3">
            <LogoLockup size="md" />
            <div className="flex-1" />
            <Badge variant="outline" className="bg-[#E1F0E8] text-[#004A2B] border-[#006B3F]/30 text-[10px]">
              No app needed
            </Badge>
          </div>
        </div>

        <div className="p-5">
          {/* STEP 1: Enter plate */}
          {step === 'enter' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#E1F0E8]">
                  <QrCode className="w-7 h-7 text-[#006B3F]" />
                </div>
                <h2 className="font-semibold text-base">Board the tuk tuk</h2>
                <p className="text-sm text-muted-foreground">
                  Look for the QR code inside the tuk tuk, or enter the plate number on the dashboard to start your ride.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tuk tuk plate</label>
                <Input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupVehicle()}
                  placeholder="e.g. KDB 112T"
                  className="text-center font-mono text-lg tracking-wider uppercase"
                />
              </div>
              {loadError && <p className="text-sm text-[#BB0000]">{loadError}</p>}
              <Button
                onClick={lookupVehicle}
                disabled={loadingVehicle}
                className="w-full bg-[#006B3F] hover:bg-[#004A2B] text-white h-12"
              >
                {loadingVehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                {loadingVehicle ? 'Finding tuk tuk...' : 'Continue'}
              </Button>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPlate('KDB 112T')}
                >
                  Try: KDB 112T (Nairobi)
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setPlate('KMD 220A')}
                  >
                    KMD 220A (MBA South)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setPlate('KMD 904D')}
                  >
                    KMD 904D (MBA Town)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Pick stage */}
          {step === 'stage' && vehicle && (
            <div className="space-y-4">
              <div className="rounded-lg bg-[#E1F0E8] border-l-4 border-[#006B3F] p-3 text-sm">
                <div className="font-semibold text-[#004A2B]">You are in <span className="font-mono">{vehicle.plate}</span></div>
                <div className="text-[#006B3F] text-xs mt-0.5">
                  {vehicle.driver?.name} · {vehicle.driver?.rating} ★ · {vehicle.route?.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <Badge variant="outline" className="bg-white text-[#004A2B] border-[#006B3F]/30 text-[10px]">
                    <MapPin className="w-3 h-3 mr-1" /> {vehicle.region.name}
                  </Badge>
                  {vehicle.sacco && (
                    <Badge variant="outline" className="bg-[#FBF1D6] text-[#7A5E1A] border-[#C8A951]/30 text-[10px]">
                      {vehicle.sacco.shortName ?? vehicle.sacco.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Where are you going? <span className="text-[#BB0000] normal-case">— pick your stage</span>
                </label>
                <div className="space-y-1.5 max-h-72 overflow-y-auto ke-scroll pr-1">
                  {vehicle.route?.stages.filter((s) => s.order > 0).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStage(s); setStep('pay'); setLoadError(null) }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                        selectedStage?.id === s.id
                          ? 'border-[#006B3F] bg-[#E1F0E8]'
                          : 'border-border hover:border-[#006B3F] hover:bg-[#E1F0E8]/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.isLandmark ? 'bg-[#FBF1D6]' : 'bg-[#E1F0E8]'
                      }`}>
                        <MapPin className={`w-4 h-4 ${s.isLandmark ? 'text-[#7A5E1A]' : 'text-[#006B3F]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {s.isLandmark && (
                            <span className="inline-flex items-center gap-1 text-[#7A5E1A]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A951]" />
                              landmark stage
                            </span>
                          )}
                          <span>stage #{s.order}</span>
                        </div>
                      </div>
                      <div className="font-semibold text-sm text-[#006B3F]">{kes(s.fareFromBase)}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#006B3F]" />
                  Some stages are local landmarks — the driver knows exactly where to drop you. No need to negotiate the fare.
                </p>
              </div>

              <Button variant="ghost" size="sm" onClick={resetAll} className="w-full">
                ← Change tuk tuk
              </Button>
            </div>
          )}

          {/* STEP 3: Pay */}
          {step === 'pay' && vehicle && selectedStage && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gradient-to-br from-[#006B3F] to-[#004A2B] text-white p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-[#C8A951] font-semibold">Your fare</div>
                <div className="text-4xl font-bold mt-1">{kes(selectedStage.fareFromBase * paxCount)}</div>
                <div className="text-xs mt-1 text-white/80">To: {selectedStage.name}</div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Passengers</label>
                  <Select value={String(paxCount)} onValueChange={(v) => setPaxCount(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 passenger</SelectItem>
                      <SelectItem value="2">2 passengers</SelectItem>
                      <SelectItem value="3">3 passengers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Your name (optional)</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mary W." />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Choose payment</label>
                <div className="grid grid-cols-2 gap-2">
                  <PaymentCard icon="mpesa" label="M-Pesa" sub="STK push" selected={paymentMethod === 'mpesa'} onClick={() => setPaymentMethod('mpesa')} />
                  <PaymentCard icon="qr" label="Scan QR" sub="Camera pay" selected={paymentMethod === 'qr'} onClick={() => setPaymentMethod('qr')} />
                  <PaymentCard icon="nfc" label="NFC tap" sub="Tap reader" selected={paymentMethod === 'nfc'} onClick={() => setPaymentMethod('nfc')} />
                  <PaymentCard icon="cash" label="Cash" sub="Pay driver" selected={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} />
                </div>
              </div>

              {paymentMethod === 'mpesa' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">M-Pesa phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XX XXX XXX"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    An M-Pesa prompt will be sent to your phone. Enter your M-Pesa PIN to confirm — no paybill needed.
                  </p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="rounded-lg bg-[#FBF1D6] border-l-4 border-[#C8A951] p-3 text-xs text-[#7A5E1A]">
                  <strong>Cash payment:</strong> Hand the exact amount ({kes(selectedStage.fareFromBase * paxCount)}) to the driver.
                  The driver will tap &ldquo;Confirm cash&rdquo; on their screen — you&apos;ll see the confirmation here.
                </div>
              )}

              {loadError && <p className="text-sm text-[#BB0000]">{loadError}</p>}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('stage')} className="flex-1">
                  ← Back
                </Button>
                <Button
                  onClick={submitPayment}
                  disabled={submitting}
                  className="flex-[2] bg-[#006B3F] hover:bg-[#004A2B] text-white"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Pay {kes(selectedStage.fareFromBase * paxCount)}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Processing */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex w-16 h-16 rounded-full bg-[#E1F0E8] items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#006B3F] animate-spin" />
              </div>
              <div>
                <div className="font-semibold">
                  {paymentMethod === 'mpesa' ? 'Sending M-Pesa prompt...' : 'Processing payment...'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {paymentMethod === 'mpesa'
                    ? 'Check your phone and enter your M-Pesa PIN'
                    : 'Confirming with the driver'}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Confirmed */}
          {step === 'confirmed' && confirmation && (
            <div className="py-6 text-center space-y-4">
              <div className="inline-flex w-16 h-16 rounded-full bg-[#006B3F] items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg text-[#004A2B]">Asante! Payment received</div>
                <div className="text-sm text-muted-foreground mt-1">
                  The driver has been notified automatically — sit back and enjoy the ride.
                </div>
              </div>

              <div className="rounded-lg border p-4 text-left space-y-2 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fare paid</span>
                  <span className="font-semibold">{kes(confirmation.fare)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-semibold">{confirmation.destination}</span>
                </div>
                {confirmation.mpesaRef && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">M-Pesa ref</span>
                    <span className="font-mono font-semibold">{confirmation.mpesaRef}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tuk tuk</span>
                  <span className="font-mono font-semibold">{vehicle?.plate}</span>
                </div>
              </div>

              <div className="rounded-lg bg-[#E1F0E8] p-3 text-xs text-[#004A2B] flex items-start gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>You&apos;ll be reminded when approaching your stage. The driver gets a hands-free alert — no need to flag them down.</span>
              </div>

              <Button variant="outline" onClick={resetAll} className="w-full">
                Done
              </Button>
            </div>
          )}

          {/* Footer */}
          {vehicle && (
            <div className="mt-6 pt-4 border-t flex items-center justify-center gap-3 text-xs text-muted-foreground">
              {vehicle.isElectric && (
                <Badge variant="outline" className="bg-[#E1F0E8] text-[#004A2B] border-[#006B3F]/30">
                  <Zap className="w-3 h-3 mr-1" /> Electric
                </Badge>
              )}
              <span>{vehicle.batteryPct}% battery</span>
              {vehicle.driver && (
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#C8A951] text-[#C8A951]" />
                  {vehicle.driver.rating}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function PaymentCard({ icon, label, sub, selected, onClick }: {
  icon: 'mpesa' | 'qr' | 'nfc' | 'cash'
  label: string
  sub: string
  selected: boolean
  onClick: () => void
}) {
  const Icon = icon === 'mpesa' ? Smartphone : icon === 'qr' ? QrCode : icon === 'nfc' ? Zap : Coins
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition-colors ${
        selected ? 'border-[#006B3F] bg-[#E1F0E8]' : 'border-border hover:border-[#006B3F]/50'
      }`}
    >
      <Icon className={`w-5 h-5 mb-1.5 ${selected ? 'text-[#006B3F]' : 'text-muted-foreground'}`} />
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </button>
  )
}
