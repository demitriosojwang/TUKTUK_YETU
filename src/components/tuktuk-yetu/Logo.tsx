'use client'

import Image from 'next/image'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_MAP: Record<LogoSize, { box: number; img: number; className: string }> = {
  sm: { box: 32, img: 28, className: 'rounded-full' },
  md: { box: 40, img: 36, className: 'rounded-full' },
  lg: { box: 56, img: 52, className: 'rounded-full' },
  xl: { box: 80, img: 72, className: 'rounded-2xl' },
}

/**
 * TUKTUK YETU branded logo.
 * Wraps the official logo (a stylized tuk tuk in Kenyan flag colours with
 * the "TUKTUK YETU" wordmark and "FARE COLLECTION. MADE EASY." tagline)
 * in a circular Kenya-flag-themed frame.
 *
 * @param size  - sm | md | lg | xl
 * @param framed - when true (default), wraps the logo in a black ring with
 *                 thin red+green inner accents, echoing the Kenyan flag.
 */
export function Logo({
  size = 'md',
  framed = true,
  showWordmark = false,
  className = '',
}: {
  size?: LogoSize
  framed?: boolean
  showWordmark?: boolean
  className?: string
}) {
  const { box, img, className: sizeClass } = SIZE_MAP[size]

  if (!framed) {
    return (
      <Image
        src="/logo.png"
        alt="TUKTUK YETU logo"
        width={img}
        height={img}
        priority
        className={`${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white ${sizeClass} ${className}`}
      style={{
        width: box,
        height: box,
        boxShadow: '0 0 0 2px #000 inset, 0 0 0 4px #fff inset, 0 0 0 6px #006B3F inset',
      }}
    >
      <Image
        src="/logo.png"
        alt="TUKTUK YETU logo"
        width={img}
        height={img}
        priority
        className="object-contain"
      />
    </div>
  )
}

/**
 * Full lockup: logo + wordmark. Used in the main header.
 */
export function LogoLockup({ size = 'md' }: { size?: LogoSize }) {
  const titleSize = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-lg'
  const subSize = size === 'lg' ? 'text-xs' : 'text-[11px]'
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} />
      <div className="leading-tight">
        <div className={`font-bold ${titleSize} tracking-tight`}>TUKTUK YETU</div>
        <div className={`${subSize} text-muted-foreground`}>Fare collection. Made easy.</div>
      </div>
    </div>
  )
}
