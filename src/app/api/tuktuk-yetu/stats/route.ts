// GET /api/tuktuk-yetu/stats - aggregated fleet stats for the admin/owner dashboard
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const vehicles = await db.vehicle.findMany({
    include: {
      region: true,
      sacco: true,
      trips: { include: { passengers: true } },
    },
  })

  let totalRevenueToday = 0
  let totalTripsToday = 0
  let totalPassengersToday = 0
  let totalLoanOutstanding = 0
  let fleetVehicles = vehicles.length
  let activeVehicles = vehicles.filter((v) => v.status === 'active').length
  let serviceVehicles = vehicles.filter((v) => v.status === 'service').length

  const perVehicle = vehicles.map((v) => {
    const todayTrips = v.trips
    const passengers = todayTrips.flatMap((t) => t.passengers)
    const revenue = passengers.filter((p) => p.paymentStatus === 'paid').reduce((s, p) => s + p.fare, 0)
    const tripCount = passengers.length

    totalRevenueToday += revenue
    totalTripsToday += tripCount
    totalPassengersToday += passengers.filter((p) => p.status === 'onboard').length
    totalLoanOutstanding += v.loanOutstanding

    const loanPaid = v.purchasePrice - v.loanOutstanding
    const loanPct = v.purchasePrice > 0 ? Math.round((loanPaid / v.purchasePrice) * 100) : 0

    return {
      id: v.id,
      plate: v.plate,
      model: v.model,
      batteryPct: v.batteryPct,
      status: v.status,
      region: { id: v.region.id, name: v.region.name },
      sacco: v.sacco ? { name: v.sacco.name, shortName: v.sacco.shortName } : null,
      revenueToday: revenue,
      tripsToday: tripCount,
      passengersOnboard: passengers.filter((p) => p.status === 'onboard').length,
      loanOutstanding: v.loanOutstanding,
      purchasePrice: v.purchasePrice,
      weeklyRepayment: v.weeklyRepayment,
      loanPaid,
      loanPct,
    }
  })

  // Group by region
  const regionIds = Array.from(new Set(vehicles.map((v) => v.region.id)))
  const byRegion = regionIds.map((rid) => {
    const rv = perVehicle.filter((v) => v.region.id === rid)
    return {
      region: rv[0].region,
      vehicles: rv,
      totals: {
        vehicles: rv.length,
        revenue: rv.reduce((s, v) => s + v.revenueToday, 0),
        loanOutstanding: rv.reduce((s, v) => s + v.loanOutstanding, 0),
      },
    }
  })

  return NextResponse.json({
    totals: {
      fleetVehicles,
      activeVehicles,
      serviceVehicles,
      totalRevenueToday,
      totalTripsToday,
      totalPassengersToday,
      totalLoanOutstanding,
    },
    perVehicle,
    byRegion,
  })
}
