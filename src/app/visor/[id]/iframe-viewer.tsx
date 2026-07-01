'use client'

import { useEffect } from 'react'

interface Props {
  src: string
  title: string
  watermark: string  // e.g. "Ana García · 01/07/2026"
}

export function IframeViewer({ src, title, watermark }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Repeat the watermark text in a grid pattern across the whole viewer
  const tiles = Array.from({ length: 24 })

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <iframe
        src={src}
        title={title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />

      {/* Watermark overlay — pointer-events:none so scroll/interaction work normally */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, zIndex: 10,
          pointerEvents: 'none', userSelect: 'none', overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
        }}
      >
        {tiles.map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: 'rotate(-30deg)',
              whiteSpace: 'nowrap',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: 'rgba(0,0,0,0.09)',
            }}
          >
            {watermark}
          </div>
        ))}
      </div>
    </div>
  )
}
