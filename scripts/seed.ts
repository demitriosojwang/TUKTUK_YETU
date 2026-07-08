// TUKTUK YETU — seed script
// Run: bun run scripts/seed.ts
import { db } from '../src/lib/db'

async function main() {
  console.log('Seeding TUKTUK YETU database...')

  // Clean
  await db.passengerTrip.deleteMany()
  await db.trip.deleteMany()
  await db.stage.deleteMany()
  await db.route.deleteMany()
  await db.vehicle.deleteMany()
  await db.driver.deleteMany()
  await db.sacco.deleteMany()
  await db.region.deleteMany()

  // ════════════════════════════════════════════════════════════
  // REGION 1: NAIROBI
  // ════════════════════════════════════════════════════════════
  const nairobi = await db.region.create({
    data: {
      name: 'Nairobi',
      city: 'Nairobi',
      description: 'Nairobi metro — CBD, Eastleigh, Pangani routes',
    },
  })

  // ===== Nairobi Drivers =====
  const driver1 = await db.driver.create({
    data: { name: 'James Mwangi', phone: '0722123456', rating: 4.8, pin: '1122' },
  })
  const driver2 = await db.driver.create({
    data: { name: 'Aisha Wanjiru', phone: '0733987654', rating: 4.9, pin: '2233' },
  })

  // ===== Nairobi Route 1: CBD – Eastleigh Loop =====
  const route1 = await db.route.create({
    data: {
      name: 'CBD - Eastleigh Loop',
      description: 'CBD -> Eastleigh 1st -> Eastleigh 2nd -> Gikomba -> Pumwani -> CBD',
      baseFare: 80,
      regionId: nairobi.id,
    },
  })
  const stages1 = await Promise.all(
    [
      { name: 'Nairobi CBD (Origin)', fareFromBase: 0, isLandmark: false, order: 0 },
      { name: 'Eastleigh 1st Avenue', fareFromBase: 80, isLandmark: false, order: 1 },
      { name: 'Eastleigh 2nd Avenue', fareFromBase: 100, isLandmark: false, order: 2 },
      { name: 'Gikomba Market', fareFromBase: 120, isLandmark: false, order: 3 },
      { name: 'Mama Otieno Kiosk', fareFromBase: 130, isLandmark: true, order: 4 },
      { name: 'Pumwani Stage', fareFromBase: 140, isLandmark: false, order: 5 },
      { name: 'After Blue House', fareFromBase: 160, isLandmark: true, order: 6 },
      { name: 'Mlango Kubwa', fareFromBase: 180, isLandmark: false, order: 7 },
    ].map((s) => db.stage.create({ data: { ...s, routeId: route1.id } })),
  )

  // ===== Nairobi Route 2: Eastleigh – Pangani Loop =====
  const route2 = await db.route.create({
    data: {
      name: 'Eastleigh - Pangani Loop',
      description: 'Eastleigh -> Pangani -> Ngara -> CBD',
      baseFare: 60,
      regionId: nairobi.id,
    },
  })
  await Promise.all(
    [
      { name: 'Eastleigh 1st Avenue (Origin)', fareFromBase: 0, isLandmark: false, order: 0 },
      { name: 'Pangani Shopping Centre', fareFromBase: 60, isLandmark: false, order: 1 },
      { name: 'Ngara Market', fareFromBase: 80, isLandmark: false, order: 2 },
      { name: 'Khoja Mosque Roundabout', fareFromBase: 100, isLandmark: true, order: 3 },
      { name: 'Nairobi CBD', fareFromBase: 120, isLandmark: false, order: 4 },
    ].map((s) => db.stage.create({ data: { ...s, routeId: route2.id } })),
  )

  // ===== Nairobi Vehicles =====
  const v1 = await db.vehicle.create({
    data: {
      plate: 'KDB 112T', model: 'Roam ET3', batteryPct: 74, isElectric: true,
      purchasePrice: 420000, loanOutstanding: 312000, weeklyRepayment: 2600,
      status: 'active', driverId: driver1.id, routeId: route1.id, regionId: nairobi.id,
    },
  })
  const v2 = await db.vehicle.create({
    data: {
      plate: 'KDB 246T', model: 'Roam ET3', batteryPct: 88, isElectric: true,
      purchasePrice: 420000, loanOutstanding: 156000, weeklyRepayment: 2600,
      status: 'active', driverId: driver2.id, routeId: route2.id, regionId: nairobi.id,
    },
  })

  // ===== Active trip on v1 =====
  const trip1 = await db.trip.create({
    data: { vehicleId: v1.id, driverId: driver1.id, status: 'active' },
  })
  await db.passengerTrip.createMany({
    data: [
      { tripId: trip1.id, passengerPhone: '0722111001', passengerName: 'Grace A.',
        destinationStageId: stages1[2].id, fare: 100, paxCount: 1, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'mpesa', mpesaRef: 'SK4H7X9P2L' },
      { tripId: trip1.id, passengerPhone: '0722111002', passengerName: 'Brian K.',
        destinationStageId: stages1[4].id, fare: 130, paxCount: 1, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'mpesa', mpesaRef: 'SK4H8M2Q7N' },
      { tripId: trip1.id, passengerPhone: '0722111003', passengerName: 'Fatima N.',
        destinationStageId: stages1[6].id, fare: 160, paxCount: 2, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'nfc' },
      { tripId: trip1.id, passengerPhone: '0722111004', passengerName: 'Walk-in',
        destinationStageId: stages1[3].id, fare: 120, paxCount: 1, status: 'onboard',
        paymentStatus: 'pending', paymentMethod: 'cash' },
    ],
  })

  // ════════════════════════════════════════════════════════════
  // REGION 2: MOMBASA SOUTH COAST  (Likoni TukTuk Association)
  // ════════════════════════════════════════════════════════════
  const mombasa = await db.region.create({
    data: {
      name: 'Mombasa South Coast',
      city: 'Mombasa',
      description: 'Likoni ferry crossings to Diani, Ukunda, Msambweni — Likoni TukTuk Owners & Drivers SACCO (LITOD)',
    },
  })

  // ===== LITOD SACCO =====
  const litod = await db.sacco.create({
    data: {
      name: 'Likoni TukTuk Owners & Drivers SACCO',
      shortName: 'LITOD',
      phone: '0719403028',
      boxOffice: 'P.O. Box 95350-80100, Mombasa',
      chairman: 'Ervin Mmaitsi',
      chairmanPhone: '0719403028',
      regionId: mombasa.id,
    },
  })

  // ===== Mombasa Drivers =====
  const driver3 = await db.driver.create({
    data: { name: 'Ervin Mmaitsi', phone: '0719403028', rating: 4.9, pin: '4455' },
  })
  const driver4 = await db.driver.create({
    data: { name: 'Dennis Njeru', phone: '0716068936', rating: 4.8, pin: '5566' },
  })
  const driver5 = await db.driver.create({
    data: { name: 'Salim Abdalla', phone: '0701333444', rating: 4.7, pin: '6677' },
  })

  // ===== Mombasa Route 3: Ferry - South Coast Run =====
  // All fares from the Likoni TukTuk Association price list (extracted via VLM)
  const route3 = await db.route.create({
    data: {
      name: 'Ferry - South Coast Run',
      description: 'Likoni Ferry crossing to south coast destinations: Shelly Beach, Mtongwe, Shikaadabu, Ukunda, Diani, Msambweni, Shimoni',
      baseFare: 30, // minimum fare on the price list
      regionId: mombasa.id,
    },
  })

  // Stages from the Likoni TukTuk Association price list
  // Ferry-origin stages 1-25 (excludes private/SGR/Airport charter entries for normal pax flow)
  const ferryStages = [
    { name: 'Likoni Ferry (Origin)', fareFromBase: 0, isLandmark: false, order: 0 },
    { name: 'Pick-up call within Likoni', fareFromBase: 200, isLandmark: true, order: 1 },
    { name: 'Sinai', fareFromBase: 30, isLandmark: false, order: 2 },
    { name: 'Kona Mpya', fareFromBase: 40, isLandmark: false, order: 3 },
    { name: 'Mtongwe', fareFromBase: 40, isLandmark: false, order: 4 },
    { name: 'Shelly Beach', fareFromBase: 30, isLandmark: false, order: 5 },
    { name: 'Pungu Villa - New York', fareFromBase: 40, isLandmark: true, order: 6 },
    { name: 'Ujamaa - Fire', fareFromBase: 40, isLandmark: true, order: 7 },
    { name: 'Shikaadabu', fareFromBase: 50, isLandmark: false, order: 8 },
    { name: 'H-London - Jara - Gambani', fareFromBase: 50, isLandmark: true, order: 9 },
    { name: 'Ngombeni - Denyenye', fareFromBase: 60, isLandmark: true, order: 10 },
    { name: 'Maganya - Kombani', fareFromBase: 70, isLandmark: true, order: 11 },
    { name: 'Jara - Unik', fareFromBase: 70, isLandmark: true, order: 12 },
    { name: 'Tiwi', fareFromBase: 100, isLandmark: false, order: 13 },
    { name: 'Ukunda', fareFromBase: 150, isLandmark: false, order: 14 },
    { name: 'Mwabungo', fareFromBase: 200, isLandmark: false, order: 15 },
    { name: 'Kinondo - Gasi', fareFromBase: 250, isLandmark: true, order: 16 },
    { name: 'Msambweni', fareFromBase: 300, isLandmark: false, order: 17 },
    { name: 'Kona ya Shimoni', fareFromBase: 400, isLandmark: false, order: 18 },
    { name: 'SGR / Airport (per person - Ringgo)', fareFromBase: 300, isLandmark: false, order: 19 },
    { name: 'Airport (per person - Ringgo)', fareFromBase: 500, isLandmark: false, order: 20 },
    { name: 'Fly Over - SGR / Airport (per person)', fareFromBase: 250, isLandmark: false, order: 21 },
    { name: 'Moi Force (Private)', fareFromBase: 100, isLandmark: true, order: 22 },
  ]
  const stages3 = await Promise.all(
    ferryStages.map((s) => db.stage.create({ data: { ...s, routeId: route3.id } })),
  )

  // ===== Mombasa Route 4: Kombani - Inland Run =====
  const route4 = await db.route.create({
    data: {
      name: 'Kombani - Inland Run',
      description: 'Kombani inland spur to Kwale, Vunga, Simba, Patanani',
      baseFare: 70,
      regionId: mombasa.id,
    },
  })
  await Promise.all(
    [
      { name: 'Kombani (Origin)', fareFromBase: 0, isLandmark: false, order: 0 },
      { name: 'Kwale', fareFromBase: 100, isLandmark: false, order: 1 },
      { name: 'Vunga', fareFromBase: 100, isLandmark: true, order: 2 },
      { name: 'Simba', fareFromBase: 70, isLandmark: true, order: 3 },
      { name: 'Patanani', fareFromBase: 70, isLandmark: true, order: 4 },
    ].map((s) => db.stage.create({ data: { ...s, routeId: route4.id } })),
  )

  // ===== Mombasa Vehicles (KMD = Mombasa county plates) =====
  const v3 = await db.vehicle.create({
    data: {
      plate: 'KMD 220A', model: 'Roam ET3', batteryPct: 82, isElectric: true,
      purchasePrice: 420000, loanOutstanding: 84000, weeklyRepayment: 2600,
      status: 'active', driverId: driver3.id, routeId: route3.id,
      regionId: mombasa.id, saccoId: litod.id,
    },
  })
  const v4 = await db.vehicle.create({
    data: {
      plate: 'KMD 481B', model: 'BasiGo E3', batteryPct: 91, isElectric: true,
      purchasePrice: 480000, loanOutstanding: 240000, weeklyRepayment: 2900,
      status: 'active', driverId: driver4.id, routeId: route3.id,
      regionId: mombasa.id, saccoId: litod.id,
    },
  })
  const v5 = await db.vehicle.create({
    data: {
      plate: 'KMD 703C', model: 'Roam ET3', batteryPct: 28, isElectric: true,
      purchasePrice: 420000, loanOutstanding: 378000, weeklyRepayment: 2600,
      status: 'service', driverId: driver5.id, routeId: route4.id,
      regionId: mombasa.id, saccoId: litod.id,
    },
  })

  // ===== Active trip on v3 (Ferry - South Coast Run) =====
  const trip3 = await db.trip.create({
    data: { vehicleId: v3.id, driverId: driver3.id, status: 'active' },
  })
  await db.passengerTrip.createMany({
    data: [
      { tripId: trip3.id, passengerPhone: '0722555001', passengerName: 'Amina S.',
        destinationStageId: stages3[14].id, fare: 150, paxCount: 1, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'mpesa', mpesaRef: 'TY8K2N4P9Q' },
      { tripId: trip3.id, passengerPhone: '0722555002', passengerName: 'John M.',
        destinationStageId: stages3[13].id, fare: 100, paxCount: 1, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'mpesa', mpesaRef: 'TY8K3M5R7S' },
      { tripId: trip3.id, passengerPhone: '0722555003', passengerName: 'Walk-in tourist',
        destinationStageId: stages3[17].id, fare: 300, paxCount: 2, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'nfc' },
      { tripId: trip3.id, passengerPhone: '0722555004', passengerName: 'Hawa A.',
        destinationStageId: stages3[4].id, fare: 40, paxCount: 1, status: 'onboard',
        paymentStatus: 'pending', paymentMethod: 'cash' },
    ],
  })

  // ════════════════════════════════════════════════════════════
  // REGION 3: MOMBASA TOWN  (Coast TukTuk Operators Welfare Group)
  // Covers Mombasa Island + mainland: Nyali, Bamburi, Mtwapa,
  // Changamwe, Airport, Miritini SGR, Ferry Crossing to south coast.
  // ════════════════════════════════════════════════════════════
  const mombasaTown = await db.region.create({
    data: {
      name: 'Mombasa Town',
      city: 'Mombasa',
      description: 'Mombasa Island & mainland — Coast TukTuk Operators Welfare Group. Covers Nyali, Bamburi, Mtwapa, Changamwe, Airport, Miritini SGR.',
    },
  })

  // ===== Coast TukTuk Operators Welfare Group SACCO =====
  const coastTuk = await db.sacco.create({
    data: {
      name: 'Coast TukTuk Operators Welfare Group',
      shortName: 'Coast TukTuk',
      phone: '0724812877',
      boxOffice: 'Mombasa, Kenya',
      chairman: 'Ali Mohammed',
      chairmanPhone: '0724812877',
      regionId: mombasaTown.id,
    },
  })

  // ===== Mombasa Town Drivers =====
  const driver6 = await db.driver.create({
    data: { name: 'Ali Mohammed', phone: '0724812877', rating: 4.8, pin: '7788' },
  })
  const driver7 = await db.driver.create({
    data: { name: 'Anwari Said', phone: '0721904506', rating: 4.9, pin: '8899' },
  })

  // ===== Mombasa Town Route: Town Run =====
  // All fares from the Coast TukTuk Operators Welfare Group price list (extracted via VLM)
  // Waiting charges: 50/- per 5 minutes (documented in route description)
  const route5 = await db.route.create({
    data: {
      name: 'Mombasa Town Run',
      description: 'Mombasa Island + mainland run. Town short distance, Tudor, Ganjoni, Liwatoni, Nyali, Bamburi, Mtwapa, Changamwe, Airport, Miritini SGR. Waiting charges: KES 50 per 5 minutes.',
      baseFare: 40, // minimum fare on the price list (Likoni/Chama or Lights/Mshoroni Chama)
      regionId: mombasaTown.id,
    },
  })

  // 35 stages from the Coast TukTuk Operators Welfare Group price list
  // Origin = Mombasa Town (CBD); grouped entries from the source split into separate stages
  const townStages = [
    { name: 'Mombasa Town (Origin)', fareFromBase: 0, isLandmark: false, order: 0 },
    { name: 'Town Short Distance', fareFromBase: 100, isLandmark: false, order: 1 },
    { name: 'Pick-up Call', fareFromBase: 150, isLandmark: true, order: 2 },
    { name: 'Lebanon Roundabout', fareFromBase: 100, isLandmark: false, order: 3 },
    { name: 'Gulshan / Koja Flats', fareFromBase: 150, isLandmark: true, order: 4 },
    { name: 'Majengo', fareFromBase: 150, isLandmark: false, order: 5 },
    { name: "King'orani Sparki", fareFromBase: 150, isLandmark: true, order: 6 },
    { name: 'Moons Makande', fareFromBase: 150, isLandmark: true, order: 7 },
    { name: '77', fareFromBase: 150, isLandmark: true, order: 8 },
    { name: 'Tudor', fareFromBase: 150, isLandmark: false, order: 9 },
    { name: 'Tudor Nora', fareFromBase: 200, isLandmark: true, order: 10 },
    { name: 'Royal Court', fareFromBase: 100, isLandmark: false, order: 11 },
    { name: 'Railway Station', fareFromBase: 150, isLandmark: false, order: 12 },
    { name: 'D.T Dobie / Hare Krishna', fareFromBase: 100, isLandmark: true, order: 13 },
    { name: 'Ganjoni', fareFromBase: 100, isLandmark: false, order: 14 },
    { name: 'Liwatoni', fareFromBase: 150, isLandmark: false, order: 15 },
    { name: 'Liwatoni Coca Cola', fareFromBase: 200, isLandmark: true, order: 16 },
    { name: 'Bondeni / Kilifi', fareFromBase: 100, isLandmark: false, order: 17 },
    { name: 'Bondeni / Kilifi (Peak Hours)', fareFromBase: 150, isLandmark: true, order: 18 },
    { name: 'Coast General / Allidina', fareFromBase: 150, isLandmark: false, order: 19 },
    { name: 'Kidogo Bus / Biashara Street', fareFromBase: 200, isLandmark: true, order: 20 },
    { name: 'Shimanzi', fareFromBase: 200, isLandmark: false, order: 21 },
    { name: 'Changamwe', fareFromBase: 400, isLandmark: false, order: 22 },
    { name: 'Airport', fareFromBase: 700, isLandmark: false, order: 23 },
    { name: 'Jomvu / Mikindani', fareFromBase: 700, isLandmark: false, order: 24 },
    { name: 'Miritini (SGR)', fareFromBase: 1000, isLandmark: false, order: 25 },
    { name: 'Nyali BP', fareFromBase: 400, isLandmark: false, order: 26 },
    { name: 'Mamba', fareFromBase: 500, isLandmark: true, order: 27 },
    { name: 'Reef / Nakumatt Nyali', fareFromBase: 500, isLandmark: true, order: 28 },
    { name: 'Bamburi Public Beach', fareFromBase: 500, isLandmark: false, order: 29 },
    { name: 'Kisauni Mwandoni', fareFromBase: 300, isLandmark: false, order: 30 },
    { name: 'Kisauni Bamburi', fareFromBase: 300, isLandmark: false, order: 31 },
    { name: 'Shanzu Beach Serena', fareFromBase: 700, isLandmark: false, order: 32 },
    { name: 'Mtwapa', fareFromBase: 1200, isLandmark: false, order: 33 },
    { name: 'Mama Ngina / Ndho Market / Nakumatt', fareFromBase: 100, isLandmark: true, order: 34 },
    { name: 'Ferry Crossing', fareFromBase: 1200, isLandmark: false, order: 35 },
    { name: 'Shelly Beach', fareFromBase: 1400, isLandmark: false, order: 36 },
    { name: 'Ukunda', fareFromBase: 2500, isLandmark: false, order: 37 },
    { name: 'Likoni / Chama', fareFromBase: 40, isLandmark: true, order: 38 },
    { name: 'Lights / Mshoroni Chama', fareFromBase: 40, isLandmark: true, order: 39 },
  ]
  const stages5 = await Promise.all(
    townStages.map((s) => db.stage.create({ data: { ...s, routeId: route5.id } })),
  )

  // ===== Mombasa Town Vehicles =====
  const v6 = await db.vehicle.create({
    data: {
      plate: 'KMD 904D', model: 'Roam ET3', batteryPct: 78, isElectric: true,
      purchasePrice: 420000, loanOutstanding: 168000, weeklyRepayment: 2600,
      status: 'active', driverId: driver6.id, routeId: route5.id,
      regionId: mombasaTown.id, saccoId: coastTuk.id,
    },
  })
  const v7 = await db.vehicle.create({
    data: {
      plate: 'KMD 615E', model: 'BasiGo E3', batteryPct: 92, isElectric: true,
      purchasePrice: 480000, loanOutstanding: 96000, weeklyRepayment: 2900,
      status: 'active', driverId: driver7.id, routeId: route5.id,
      regionId: mombasaTown.id, saccoId: coastTuk.id,
    },
  })

  // ===== Active trip on v6 (Mombasa Town Run) =====
  const trip6 = await db.trip.create({
    data: { vehicleId: v6.id, driverId: driver6.id, status: 'active' },
  })
  await db.passengerTrip.createMany({
    data: [
      { tripId: trip6.id, passengerPhone: '0722666001', passengerName: 'Mary W.',
        destinationStageId: stages5[33].id, fare: 1200, paxCount: 1, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'mpesa', mpesaRef: 'TY9M1T2P3Q' },
      { tripId: trip6.id, passengerPhone: '0722666002', passengerName: 'Tourist (Bamburi)',
        destinationStageId: stages5[29].id, fare: 500, paxCount: 2, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'nfc' },
      { tripId: trip6.id, passengerPhone: '0722666003', passengerName: 'Hassan A.',
        destinationStageId: stages5[25].id, fare: 1000, paxCount: 1, status: 'onboard',
        paymentStatus: 'paid', paymentMethod: 'mpesa', mpesaRef: 'TY9M2U4R5S' },
      { tripId: trip6.id, passengerPhone: '0722666004', passengerName: 'Walk-in',
        destinationStageId: stages5[1].id, fare: 100, paxCount: 1, status: 'onboard',
        paymentStatus: 'pending', paymentMethod: 'cash' },
    ],
  })

  console.log('Seed complete.')
  console.log('  Regions: 3 (Nairobi, Mombasa South Coast, Mombasa Town)')
  console.log('  SACCOs: 2 (LITOD, Coast TukTuk Operators Welfare Group)')
  console.log('  Drivers: 7')
  console.log('  Routes: 5')
  console.log('    - Nairobi: CBD-Eastleigh Loop, Eastleigh-Pangani Loop')
  console.log('    - Mombasa South Coast (LITOD): Ferry-South Coast Run (23 stages), Kombani-Inland Run')
  console.log('    - Mombasa Town (Coast TukTuk): Mombasa Town Run (40 stages from Coast TukTuk price list)')
  console.log('  Vehicles: 7 (Nairobi KDB 112T/246T, Mombasa South KMD 220A/481B/703C, Mombasa Town KMD 904D/615E)')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
