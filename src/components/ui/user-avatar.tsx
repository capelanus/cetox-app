'use client'

// ── Deterministic color palette ──────────────────────────────────────────────
// Each pair: [background, text]
const PALETTE: [string, string][] = [
  ['#1E3A5F', '#60A5FA'],  // navy / blue
  ['#4C1D95', '#C084FC'],  // violet / purple
  ['#064E3B', '#6EE7B7'],  // forest / emerald
  ['#7C2D12', '#FDBA74'],  // brick / orange
  ['#1C1917', '#D6D3D1'],  // charcoal / stone
  ['#831843', '#F9A8D4'],  // wine / pink
  ['#134E4A', '#5EEAD4'],  // deep teal / teal
  ['#1E1B4B', '#818CF8'],  // midnight / indigo
  ['#3B0764', '#E879F9'],  // plum / fuchsia
  ['#0C4A6E', '#38BDF8'],  // ocean / sky
  ['#365314', '#86EFAC'],  // olive / lime
  ['#1C3240', '#4AC3B2'],  // cetox dark / cetox teal
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function getAvatarColors(nombre: string): [string, string] {
  return PALETTE[hashString(nombre) % PALETTE.length]
}

export function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Size map ──────────────────────────────────────────────────────────────────

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_MAP: Record<AvatarSize, { px: number; fontSize: number }> = {
  xs: { px: 20,  fontSize: 8  },
  sm: { px: 28,  fontSize: 11 },
  md: { px: 36,  fontSize: 13 },
  lg: { px: 48,  fontSize: 16 },
  xl: { px: 64,  fontSize: 20 },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface UserAvatarProps {
  nombre:    string
  size?:     AvatarSize
  className?: string
  style?:    React.CSSProperties
  title?:    string
}

export function UserAvatar({
  nombre,
  size = 'md',
  className = '',
  style,
  title,
}: UserAvatarProps) {
  const [bg, fg]  = getAvatarColors(nombre)
  const initials  = getInitials(nombre)
  const { px, fontSize } = SIZE_MAP[size]

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none ${className}`}
      style={{
        backgroundColor: bg,
        color:           fg,
        width:           px,
        height:          px,
        fontSize,
        fontFamily:      'var(--font-oswald)',
        letterSpacing:   '0.05em',
        ...style,
      }}
      title={title ?? nombre}
    >
      {initials}
    </div>
  )
}
