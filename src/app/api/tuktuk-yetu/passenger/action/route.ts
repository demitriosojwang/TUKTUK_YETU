// POST /api/tuktuk-yetu/passenger/action
//   { passengerTripId, action: 'alight' | 'confirmCash' }
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { passengerTripId, action } = body as { passengerTripId: string; action: 'alight' | 'confirmCash' }

  if (!passengerTripId || !action) {
    return NextResponse.json({ error: 'passengerTripId and action required' }, { status: 400 })
  }

  const pax = await db.passengerTrip.findUnique({ where: { id: passengerTripId } })
  if (!pax) return NextResponse.json({ error: 'passenger trip not found' }, { status: 404 })

  if (action === 'alight') {
    const updated = await db.passengerTrip.update({
      where: { id: passengerTripId },
      data: { status: 'alighted', alightedAt: new Date() },
    })
    return NextResponse.json({ ok: true, passengerTrip: updated })
  }

  if (action === 'confirmCash') {
    const updated = await db.passengerTrip.update({
      where: { id: passengerTripId },
      data: { paymentStatus: 'paid', mpesaRef: 'CASH' },
    })
    return NextResponse.json({ ok: true, passengerTrip: updated })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
