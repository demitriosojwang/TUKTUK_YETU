// GET  /api/tuktuk-yetu/vehicle?plate=KDB+112T  - get full vehicle detail with active trip & passengers
// PATCH /api/tuktuk-yetu/vehicle  - update battery / status
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const plate = req.nextUrl.searchParams.get('plate')?.toUpperCase().trim()
  if (!plate) return NextResponse.json({ error: 'plate is required' }, { status: 400 })

  const v = await db.vehicle.findFirst({
    where: { plate },
    include: {
      driver: true,
      route: { include: { stages: { orderBy: { order: 'asc' } } } },
      region: true,
      sacco: true,
      trips: {
        where: { status: 'active' },
        include: {
          passengers: {
            include: { destinationStage: true },
            orderBy: { boardedAt: 'asc' },
          },
        },
      },
    },
  })

  if (!v) return NextResponse.json({ error: 'vehicle not found' }, { status: 404 })

  const activeTrip = v.trips[0]
  const passengers = activeTrip?.passengers ?? []
  const revenue = passengers.filter((p) => p.paymentStatus === 'paid').reduce((s, p) => s + p.fare, 0)

  return NextResponse.json({
    id: v.id,
    plate: v.plate,
    model: v.model,
    batteryPct: v.batteryPct,
    status: v.status,
    isElectric: v.isElectric,
    region: { id: v.region.id, name: v.region.name, city: v.region.city },
    sacco: v.sacco ? { id: v.sacco.id, name: v.sacco.name, shortName: v.sacco.shortName, phone: v.sacco.phone } : null,
    driver: v.driver,
    route: v.route,
    activeTrip: activeTrip
      ? {
          id: activeTrip.id,
          startedAt: activeTrip.startedAt,
          passengers: passengers.map((p) => ({
            id: p.id,
            phone: p.passengerPhone,
            name: p.passengerName,
            paxCount: p.paxCount,
            fare: p.fare,
            status: p.status,
            paymentStatus: p.paymentStatus,
            paymentMethod: p.paymentMethod,
            mpesaRef: p.mpesaRef,
            boardedAt: p.boardedAt,
            destination: {
              id: p.destinationStage.id,
              name: p.destinationStage.name,
              isLandmark: p.destinationStage.isLandmark,
              fareFromBase: p.destinationStage.fareFromBase,
              order: p.destinationStage.order,
            },
          })),
        }
      : null,
    revenueToday: revenue,
    loanOutstanding: v.loanOutstanding,
    weeklyRepayment: v.weeklyRepayment,
    purchasePrice: v.purchasePrice,
  })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { plate, batteryPct, status } = body as { plate: string; batteryPct?: number; status?: string }
  if (!plate) return NextResponse.json({ error: 'plate is required' }, { status: 400 })

  const data: { batteryPct?: number; status?: string } = {}
  if (typeof batteryPct === 'number') data.batteryPct = Math.max(0, Math.min(100, batteryPct))
  if (status) data.status = status

  const v = await db.vehicle.update({ where: { plate }, data })
  return NextResponse.json({ ok: true, vehicle: { plate: v.plate, batteryPct: v.batteryPct, status: v.status } })
}
