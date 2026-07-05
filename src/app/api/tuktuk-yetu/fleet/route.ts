// GET /api/tuktuk-yetu/fleet - list all vehicles grouped by region, with driver, route, today's trip & stats
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const vehicles = await db.vehicle.findMany({
    include: {
      driver: true,
      route: { include: { stages: { orderBy: { order: 'asc' } } } },
      region: true,
      sacco: true,
      trips: {
        where: { status: 'active' },
        include: { passengers: { include: { destinationStage: true } } },
      },
    },
    orderBy: { plate: 'asc' },
  })

  const fleet = vehicles.map((v) => {
    const activeTrip = v.trips[0]
    const passengers = activeTrip?.passengers ?? []
    const onboard = passengers.filter((p) => p.status === 'onboard')
    const revenue = passengers
      .filter((p) => p.paymentStatus === 'paid')
      .reduce((sum, p) => sum + p.fare, 0)
    return {
      id: v.id,
      plate: v.plate,
      model: v.model,
      batteryPct: v.batteryPct,
      status: v.status,
      isElectric: v.isElectric,
      region: { id: v.region.id, name: v.region.name, city: v.region.city },
      sacco: v.sacco ? { id: v.sacco.id, name: v.sacco.name, shortName: v.sacco.shortName } : null,
      driver: v.driver ? { id: v.driver.id, name: v.driver.name, rating: v.driver.rating, phone: v.driver.phone } : null,
      route: v.route ? { id: v.route.id, name: v.route.name, baseFare: v.route.baseFare } : null,
      activeTripId: activeTrip?.id ?? null,
      passengersOnboard: onboard.length,
      revenueToday: revenue,
      loanOutstanding: v.loanOutstanding,
      weeklyRepayment: v.weeklyRepayment,
      purchasePrice: v.purchasePrice,
    }
  })

  // Group by region
  const regions = Array.from(new Set(fleet.map((v) => v.region.id)))
  const grouped = regions.map((rid) => {
    const regionFleet = fleet.filter((v) => v.region.id === rid)
    return {
      region: regionFleet[0].region,
      vehicles: regionFleet,
    }
  })

  return NextResponse.json({ fleet, grouped })
}
