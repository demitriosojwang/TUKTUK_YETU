// GET  /api/tuktuk-yetu/passenger?plate=KDB+112T - get vehicle, route, stages for passenger booking flow
// POST /api/tuktuk-yetu/passenger - passenger boards and pays
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
      trips: { where: { status: 'active' } },
    },
  })
  if (!v) return NextResponse.json({ error: 'vehicle not found' }, { status: 404 })

  return NextResponse.json({
    plate: v.plate,
    model: v.model,
    isElectric: v.isElectric,
    batteryPct: v.batteryPct,
    region: { id: v.region.id, name: v.region.name, city: v.region.city },
    sacco: v.sacco ? { name: v.sacco.name, shortName: v.sacco.shortName } : null,
    driver: v.driver ? { name: v.driver.name, rating: v.driver.rating } : null,
    route: v.route
      ? {
          id: v.route.id,
          name: v.route.name,
          description: v.route.description,
          baseFare: v.route.baseFare,
          stages: v.route.stages.map((s) => ({
            id: s.id,
            name: s.name,
            isLandmark: s.isLandmark,
            fareFromBase: s.fareFromBase,
            order: s.order,
          })),
        }
      : null,
    activeTripId: v.trips[0]?.id ?? null,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { plate, phone, name, destinationStageId, paxCount = 1, paymentMethod = 'mpesa' } = body as {
    plate: string
    phone: string
    name?: string
    destinationStageId: string
    paxCount?: number
    paymentMethod?: 'mpesa' | 'cash' | 'nfc' | 'qr'
  }

  if (!plate || !phone || !destinationStageId) {
    return NextResponse.json({ error: 'plate, phone and destinationStageId are required' }, { status: 400 })
  }

  const v = await db.vehicle.findFirst({
    where: { plate },
    include: { trips: { where: { status: 'active' } } },
  })
  if (!v) return NextResponse.json({ error: 'vehicle not found' }, { status: 404 })
  if (v.status !== 'active') return NextResponse.json({ error: 'vehicle is not in service' }, { status: 400 })

  const stage = await db.stage.findUnique({ where: { id: destinationStageId } })
  if (!stage) return NextResponse.json({ error: 'stage not found' }, { status: 404 })

  const fare = stage.fareFromBase * paxCount

  let trip = v.trips[0]
  if (!trip) {
    if (!v.driverId) return NextResponse.json({ error: 'no driver assigned' }, { status: 400 })
    trip = await db.trip.create({
      data: { vehicleId: v.id, driverId: v.driverId, status: 'active' },
    })
  }

  let paymentStatus: 'paid' | 'pending' = 'pending'
  let mpesaRef: string | null = null

  if (paymentMethod === 'mpesa') {
    paymentStatus = 'paid'
    mpesaRef = 'TY' + Math.random().toString(36).slice(2, 12).toUpperCase()
  } else if (paymentMethod === 'nfc' || paymentMethod === 'qr') {
    paymentStatus = 'paid'
  } else {
    paymentStatus = 'pending'
  }

  const pax = await db.passengerTrip.create({
    data: {
      tripId: trip.id,
      passengerPhone: phone,
      passengerName: name ?? null,
      destinationStageId,
      fare,
      paxCount,
      status: 'onboard',
      paymentStatus,
      paymentMethod,
      mpesaRef,
    },
    include: { destinationStage: true },
  })

  return NextResponse.json({
    ok: true,
    passengerTrip: {
      id: pax.id,
      fare: pax.fare,
      paxCount: pax.paxCount,
      paymentStatus: pax.paymentStatus,
      paymentMethod: pax.paymentMethod,
      mpesaRef: pax.mpesaRef,
      destination: {
        name: pax.destinationStage.name,
        isLandmark: pax.destinationStage.isLandmark,
      },
    },
  })
}
