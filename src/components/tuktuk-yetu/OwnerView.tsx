'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { KenyaFlagStripe, usePoll, kes } from './shared'
import {
  Bus, TrendingUp, Wallet, Users, AlertCircle, Battery, MapPin,
  CircleDot, Coins, Activity, FileText, Building2, Phone,
} from 'lucide-react'

type FleetVehicle = {
  id: string
  plate: string
  model: string
  batteryPct: number
  status: string
  isElectric: boolean
  region: { id: string; name: string; city: string }
  sacco: { id: string; name: string; shortName: string | null } | null
  driver: { id: string; name: string; rating: number; phone: string } | null
  route: { id: string; name: string; baseFare: number } | null
  activeTripId: string | null
  passengersOnboard: number
  revenueToday: number
  loanOutstanding: number
  weeklyRepayment: number
  purchasePrice: number
}

type FleetPayload = { fleet: FleetVehicle[] }

type StatsPayload = {
  totals: {
    fleetVehicles: number
    activeVehicles: number
    serviceVehicles: number
    totalRevenueToday: number
    totalTripsToday: number
    totalPassengersToday: number
    totalLoanOutstanding: number
  }
  perVehicle: Array<{
    id: string
    plate: string
    model: string
    batteryPct: number
    status: string
    region: { id: string; name: string }
    sacco: { name: string; shortName: string | null } | null
    revenueToday: number
    tripsToday: number
    passengersOnboard: number
    loanOutstanding: number
    purchasePrice: number
    weeklyRepayment: number
    loanPaid: number
    loanPct: number
  }>
  byRegion: Array<{
    region: { id: string; name: string }
    vehicles: any[]
    totals: { vehicles: number; revenue: number; loanOutstanding: number }
  }>
}

export function OwnerView() {
  const { data: fleetData, loading: fleetLoading } = usePoll<FleetPayload>('/api/tuktuk-yetu/fleet', 5000)
  const { data: statsData } = usePoll<StatsPayload>('/api/tuktuk-yetu/stats', 5000)

  // Region + vehicle selection
  const regions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; city: string }>()
    fleetData?.fleet.forEach((v) => {
      if (!seen.has(v.region.id)) seen.set(v.region.id, v.region)
    })
    return Array.from(seen.values())
  }, [fleetData])

  const [selectedRegionId, setSelectedRegionId] = useState<string>('all')
  const [selectedPlate, setSelectedPlate] = useState<string>('')

  // Filter fleet by selected region
  const filteredFleet = useMemo(() => {
    if (!fleetData) return []
    if (selectedRegionId === 'all') return fleetData.fleet
    return fleetData.fleet.filter((v) => v.region.id === selectedRegionId)
  }, [fleetData, selectedRegionId])

  // Auto-select first vehicle in the filtered list when region changes
  const effectivePlate = useMemo(() => {
    if (filteredFleet.length === 0) return ''
    const found = filteredFleet.find((v) => v.plate === selectedPlate)
    if (found) return selectedPlate
    return filteredFleet[0].plate
  }, [filteredFleet, selectedPlate])

  const selected = filteredFleet.find((v) => v.plate === effectivePlate)
  const selectedStats = statsData?.perVehicle.find((v) => v.plate === effectivePlate)

  const totals = statsData?.totals
  const regionTotals = statsData?.byRegion.find((r) => r.region.id === selectedRegionId)

  if (fleetLoading && !fleetData) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-muted-foreground">
        Loading fleet overview...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <KenyaFlagStripe thick />

      {/* Header */}
      <Card className="rounded-t-none border-t-0 overflow-hidden">
        <div className="ke-gradient-green p-5 relative">
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-black" />
            <div className="flex-1 bg-[#BB0000]" />
            <div className="flex-1 bg-[#006B3F]" />
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#BB0000]" />
          <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-white" />

          <div className="flex items-center gap-3 mb-4 ml-2">
            <TrendingUp className="w-6 h-6 text-[#C8A951]" />
            <div>
              <div className="font-bold text-lg">Fleet overview</div>
              <div className="text-xs text-white/80">TUKTUK YETU · Owner / Admin dashboard</div>
            </div>
          </div>

          {totals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-2">
              <FleetStat label="Fleet size" value={String(totals.fleetVehicles)} />
              <FleetStat label="Active now" value={String(totals.activeVehicles)} />
              <FleetStat label="Revenue today" value={kes(totals.totalRevenueToday)} />
              <FleetStat label="Loan outstanding" value={kes(totals.totalLoanOutstanding)} />
            </div>
          )}
        </div>
      </Card>

      {/* Region selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-sm inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#006B3F]" /> Region
          </div>
          <Badge variant="outline" className="bg-[#E1F0E8] text-[#004A2B] border-[#006B3F]/30">
            {regions.length} regions
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <RegionChip
            active={selectedRegionId === 'all'}
            onClick={() => { setSelectedRegionId('all'); setSelectedPlate('') }}
            label="All regions"
            count={fleetData?.fleet.length ?? 0}
          />
          {regions.map((r) => {
            const count = fleetData?.fleet.filter((v) => v.region.id === r.id).length ?? 0
            return (
              <RegionChip
                key={r.id}
                active={selectedRegionId === r.id}
                onClick={() => { setSelectedRegionId(r.id); setSelectedPlate('') }}
                label={r.name}
                count={count}
              />
            )
          })}
        </div>
      </Card>

      {/* Per-vehicle switcher (filtered) */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-sm inline-flex items-center gap-1.5">
            <Bus className="w-4 h-4 text-[#006B3F]" /> Select vehicle
          </div>
          <Badge variant="outline" className="bg-[#E1F0E8] text-[#004A2B] border-[#006B3F]/30">
            {filteredFleet.length} vehicles
          </Badge>
        </div>

        {filteredFleet.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            No vehicles in this region yet.
          </div>
        ) : (
          <>
            <Select value={effectivePlate} onValueChange={setSelectedPlate}>
              <SelectTrigger className="font-mono">
                <SelectValue placeholder="Choose a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {filteredFleet.map((v) => (
                  <SelectItem key={v.id} value={v.plate}>
                    <span className="font-mono mr-2">{v.plate}</span>
                    <span className="text-muted-foreground">· {v.driver?.name ?? 'Unassigned'} · {v.route?.name ?? 'No route'}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quick vehicle chips */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {filteredFleet.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedPlate(v.plate)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-colors border ${
                    effectivePlate === v.plate
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-foreground border-border hover:border-black'
                  }`}
                >
                  {v.plate}
                  {v.status === 'service' && <span className="ml-1.5 text-[#BB0000]">●</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Selected vehicle detail */}
      {selected && (
        <>
          {/* Vehicle hero */}
          <Card className="overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-black to-neutral-900 text-white relative">
              <div className="absolute top-0 left-0 right-0 h-1 flex">
                <div className="flex-1 bg-black" />
                <div className="flex-1 bg-[#BB0000]" />
                <div className="flex-1 bg-[#006B3F]" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#C8A951] font-semibold">Vehicle</div>
                  <div className="font-bold text-2xl font-mono">{selected.plate}</div>
                  <div className="text-sm text-white/70 mt-0.5">{selected.model}</div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[10px]">
                      <MapPin className="w-3 h-3 mr-1" /> {selected.region.name}
                    </Badge>
                    {selected.sacco && (
                      <Badge variant="outline" className="bg-[#C8A951]/20 text-[#C8A951] border-[#C8A951]/40 text-[10px]">
                        <Building2 className="w-3 h-3 mr-1" /> {selected.sacco.shortName ?? selected.sacco.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge className={
                  selected.status === 'active' ? 'bg-[#006B3F] text-white hover:bg-[#006B3F]'
                  : selected.status === 'service' ? 'bg-[#BB0000] text-white hover:bg-[#BB0000]'
                  : 'bg-white/10 text-white hover:bg-white/10'
                }>
                  <CircleDot className="w-3 h-3 mr-1" /> {selected.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <HeroStat label="Revenue today" value={kes(selected.revenueToday).replace('KES ', 'KSh ')} />
                <HeroStat label="On board" value={String(selected.passengersOnboard)} />
                <HeroStat label="Battery" value={`${selected.batteryPct}%`} />
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70 inline-flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5" /> Charge level
                  </span>
                  <span className="text-[#C8A951] font-semibold">{selected.batteryPct}%</span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selected.batteryPct}%`,
                      background: selected.batteryPct < 20 ? '#BB0000' : selected.batteryPct < 40 ? '#C8A951' : 'linear-gradient(to right, #006B3F, #C8A951)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <InfoRow icon="driver" label="Driver" value={selected.driver?.name ?? 'Unassigned'} sub={selected.driver ? `${selected.driver.rating} ★ · ${selected.driver.phone}` : undefined} />
              <InfoRow icon="route" label="Route" value={selected.route?.name ?? 'No route'} sub={selected.route ? `Base fare ${kes(selected.route.baseFare)}` : undefined} />
            </div>
          </Card>

          {/* SACCO card (only if vehicle has a SACCO) */}
          {selected.sacco && (
            <Card className="p-4 border-[#C8A951]/30 bg-gradient-to-br from-[#FBF1D6] to-white">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-[#7A5E1A]" />
                <div className="font-semibold text-sm">SACCO — {selected.sacco.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground uppercase tracking-wide mb-0.5">Short name</div>
                  <div className="font-semibold">{selected.sacco.shortName ?? '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground uppercase tracking-wide mb-0.5">Region</div>
                  <div className="font-semibold">{selected.region.name}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Financial health */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-[#006B3F]" />
              <div className="font-semibold text-sm">Financial health — {selected.plate}</div>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Vehicle purchase price" value={kes(selected.purchasePrice)} />
              <Row label="Loan outstanding" value={kes(selected.loanOutstanding)} valueClass="text-[#BB0000]" />
              <Row label="Weekly repayment" value={kes(selected.weeklyRepayment)} />
              <Row label="Revenue today" value={kes(selected.revenueToday)} valueClass="text-[#006B3F]" bold />
              <div className="border-t pt-2 mt-2" />
              <Row label="Loan paid so far" value={kes(selectedStats?.loanPaid ?? (selected.purchasePrice - selected.loanOutstanding))} />
            </div>

            {/* Loan progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Loan repayment progress</span>
                <span className="font-semibold">{selectedStats?.loanPct ?? Math.round(((selected.purchasePrice - selected.loanOutstanding) / selected.purchasePrice) * 100)}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${selectedStats?.loanPct ?? Math.round(((selected.purchasePrice - selected.loanOutstanding) / selected.purchasePrice) * 100)}%`,
                    background: 'linear-gradient(to right, #006B3F, #004A2B)',
                  }}
                />
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <Badge variant="outline" className="bg-[#E1F0E8] text-[#004A2B] border-[#006B3F]/30 text-[10px]">
                  {selectedStats?.loanPct ?? Math.round(((selected.purchasePrice - selected.loanOutstanding) / selected.purchasePrice) * 100)}% paid
                </Badge>
                <Badge variant="outline" className="bg-[#FCE4E4] text-[#8C0000] border-[#BB0000]/30 text-[10px]">
                  {kes(selected.loanOutstanding)} left
                </Badge>
                {selected.revenueToday >= selected.weeklyRepayment / 7 ? (
                  <Badge variant="outline" className="bg-[#E1F0E8] text-[#004A2B] border-[#006B3F]/30 text-[10px]">On schedule</Badge>
                ) : (
                  <Badge variant="outline" className="bg-[#FBF1D6] text-[#7A5E1A] border-[#C8A951]/30 text-[10px]">Behind schedule</Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Fleet-wide comparison (within selected region or all) */}
          {statsData && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[#006B3F]" />
                <div className="font-semibold text-sm">
                  {selectedRegionId === 'all' ? 'Fleet-wide comparison' : `Comparison — ${selected?.region.name}`}
                </div>
              </div>
              <div className="space-y-2">
                {statsData.perVehicle
                  .filter((v) => selectedRegionId === 'all' || v.region.id === selectedRegionId)
                  .slice()
                  .sort((a, b) => b.revenueToday - a.revenueToday)
                  .map((v) => {
                    const visible = statsData.perVehicle.filter((p) => selectedRegionId === 'all' || p.region.id === selectedRegionId)
                    const max = Math.max(...visible.map((p) => p.revenueToday), 1)
                    const pct = Math.round((v.revenueToday / max) * 100)
                    const isSelected = v.plate === effectivePlate
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedPlate(v.plate)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                          isSelected ? 'border-black bg-muted/50' : 'border-border hover:border-black/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-sm">{v.plate}</span>
                            {v.sacco?.shortName && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-[#FBF1D6] text-[#7A5E1A] border-[#C8A951]/30">
                                {v.sacco.shortName}
                              </Badge>
                            )}
                            {v.status === 'service' && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-[#FCE4E4] text-[#8C0000] border-[#BB0000]/30">service</Badge>
                            )}
                            {v.batteryPct < 40 && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-[#FBF1D6] text-[#7A5E1A] border-[#C8A951]/30">low battery</Badge>
                            )}
                          </div>
                          <span className="font-semibold text-sm text-[#006B3F]">{kes(v.revenueToday)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: isSelected ? '#000' : 'linear-gradient(to right, #006B3F, #004A2B)',
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>{v.tripsToday} trips · {v.passengersOnboard} on board</span>
                          <span>{v.region.name} · battery {v.batteryPct}%</span>
                        </div>
                      </button>
                    )
                  })}
              </div>
            </Card>
          )}

          {/* Service alerts */}
          {selected.batteryPct < 40 && (
            <Card className="p-3 border-[#BB0000]/30 bg-[#FCE4E4]">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#BB0000] flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-[#8C0000]">Service alert:</strong>
                  <span className="text-[#8C0000]"> {selected.plate} battery is at {selected.batteryPct}%. Charge soon to avoid downtime.</span>
                </div>
              </div>
            </Card>
          )}

          {/* 30-day summary mock */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#006B3F]" />
              <div className="font-semibold text-sm">30-day summary — for lender / SACCO</div>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Total revenue (30 days)" value={kes(selected.revenueToday * 30)} valueClass="text-[#006B3F]" bold />
              <Row label="Total trips (30 days)" value={String((selectedStats?.tripsToday ?? 1) * 30)} />
              <Row label="Avg revenue / day" value={kes(selected.revenueToday)} />
              <Row label="Loan repaid (30 days)" value={kes(selected.weeklyRepayment * 4)} />
              <Row label="Loan coverage ratio" value="2.3× — healthy" valueClass="text-[#006B3F]" />
            </div>
            <Button variant="outline" className="w-full mt-3 border-[#006B3F]/40 text-[#006B3F] hover:bg-[#E1F0E8]">
              <FileText className="w-4 h-4" /> Generate loan application report ↗
            </Button>
          </Card>
        </>
      )}
    </div>
  )
}

function RegionChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 rounded-lg text-left transition-colors border ${
        active ? 'bg-black text-white border-black' : 'bg-white text-foreground border-border hover:border-black/50'
      }`}
    >
      <div className="text-sm font-semibold truncate">{label}</div>
      <div className={`text-[10px] ${active ? 'text-[#C8A951]' : 'text-muted-foreground'}`}>{count} vehicle{count !== 1 ? 's' : ''}</div>
    </button>
  )
}

function FleetStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 border border-white/15 rounded-lg p-2.5">
      <div className="text-base font-bold text-white truncate">{value}</div>
      <div className="text-[10px] text-[#C8A951] mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-center">
      <div className="text-sm font-bold text-white truncate">{value}</div>
      <div className="text-[10px] text-[#C8A951] mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  )
}

function InfoRow({ icon, label, value, sub }: { icon: 'driver' | 'route'; label: string; value: string; sub?: string }) {
  const Icon = icon === 'driver' ? Users : MapPin
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide inline-flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="font-semibold text-sm">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function Row({ label, value, valueClass = '', bold = false }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? 'font-semibold' : 'font-medium'} ${valueClass}`}>{value}</span>
    </div>
  )
}
