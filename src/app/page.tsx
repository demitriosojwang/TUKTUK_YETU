'use client'

import { useState } from 'react'
import { KenyaFlagStripe } from '@/components/tuktuk-yetu/shared'
import { PassengerView } from '@/components/tuktuk-yetu/PassengerView'
import { DriverView } from '@/components/tuktuk-yetu/DriverView'
import { OwnerView } from '@/components/tuktuk-yetu/OwnerView'
import { Bus, User, ChartBar, Flag } from 'lucide-react'

type Role = 'passenger' | 'driver' | 'owner'

export default function Home() {
  const [role, setRole] = useState<Role>('passenger')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAF6EC 0%, #F4F2EC 100%)' }}>
      {/* Top flag stripe */}
      <KenyaFlagStripe thick />

      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center relative"
            style={{ boxShadow: '0 0 0 2px #BB0000 inset, 0 0 0 4px #fff inset, 0 0 0 6px #006B3F inset' }}>
            <Bus className="w-5 h-5 text-[#C8A951]" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg leading-tight tracking-tight">TUKTUK YETU</div>
            <div className="text-[11px] text-muted-foreground leading-tight">
              Electric tuk tuk fare collection · Nairobi
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-muted/50">
            <Flag className="w-3 h-3 text-[#006B3F]" />
            <span>Proudly Kenyan</span>
          </div>
        </div>

        {/* Role switcher tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/50">
            <RoleTab active={role === 'passenger'} onClick={() => setRole('passenger')} icon="user" label="Passenger" />
            <RoleTab active={role === 'driver'} onClick={() => setRole('driver')} icon="driver" label="Driver" />
            <RoleTab active={role === 'owner'} onClick={() => setRole('owner')} icon="chart" label="Admin / Owner" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-6 px-4">
        {role === 'passenger' && <PassengerView />}
        {role === 'driver' && <DriverView />}
        {role === 'owner' && <OwnerView />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-black" />
            <span className="w-2 h-2 rounded-full bg-[#BB0000]" />
            <span className="w-2 h-2 rounded-full bg-[#006B3F]" />
          </div>
          <div className="text-xs text-muted-foreground">
            <strong className="text-foreground">TUKTUK YETU</strong> · Powered by the colours of our flag · Black, Red, Green &amp; White
          </div>
          <div className="text-[10px] text-muted-foreground/70 mt-0.5">
            Built for SACCOs, drivers &amp; passengers · Nairobi, Kenya
          </div>
        </div>
      </footer>
    </div>
  )
}

function RoleTab({ active, onClick, icon, label }: {
  active: boolean
  onClick: () => void
  icon: 'user' | 'driver' | 'chart'
  label: string
}) {
  const Icon = icon === 'user' ? User : icon === 'driver' ? Bus : ChartBar
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-black text-white shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-background'
      }`}
      style={active ? { boxShadow: 'inset 0 2px 0 #BB0000, inset 0 -2px 0 #006B3F' } : undefined}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-[#C8A951]' : ''}`} />
      <span>{label}</span>
    </button>
  )
}
