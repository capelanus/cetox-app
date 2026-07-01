'use client'

import { useEffect, useRef } from 'react'

interface Props {
  src: string
  title: string
}

export function IframeViewer({ src, title }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Block keyboard shortcuts for save/print on the parent document
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <iframe
        src={src}
        title={title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />
      {/* Overlay blocks right-click and floating download buttons.
          pointer-events:auto intercepts mouse events; wheel events still reach the iframe
          underneath in most browsers so scroll works. */}
      <div
        ref={overlayRef}
        style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'default' }}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={(e) => {
          // Allow wheel-click (middle button) to pass for scroll but block left/right
          if (e.button !== 1) e.preventDefault()
        }}
      />
    </div>
  )
}
