'use client'

import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  src: string
}

export function PdfViewer({ src }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.3)
  const [containerWidth, setContainerWidth] = useState(800)

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }, [])

  // Measure container width to fit pages responsively
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(node)
  }, [])

  // Block keyboard shortcuts for save/print
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const pageWidth = Math.min(containerWidth - 32, 900)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '6px 12px', background: '#3c3c3c', borderBottom: '1px solid #555', flexShrink: 0,
      }}>
        <button
          onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
          style={{ padding: '3px 10px', background: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
        >−</button>
        <span style={{ color: '#ccc', fontSize: '13px', minWidth: '48px', textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(s => Math.min(3, s + 0.2))}
          style={{ padding: '3px 10px', background: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
        >+</button>
      </div>

      {/* PDF pages */}
      <div
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          flex: 1, overflow: 'auto', background: '#525659',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 0', gap: '12px', userSelect: 'none',
        }}
      >
        <Document
          file={src}
          onLoadSuccess={onLoadSuccess}
          loading={
            <div style={{ color: '#ccc', padding: '40px', fontSize: '14px' }}>
              Cargando documento…
            </div>
          }
          error={
            <div style={{ color: '#f87171', padding: '40px', fontSize: '14px' }}>
              No se pudo cargar el documento.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={pageWidth * scale}
              renderTextLayer
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  )
}
