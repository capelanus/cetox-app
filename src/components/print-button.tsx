'use client'

import { Printer } from 'lucide-react'

export function PrintButton({ label = 'Imprimir' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white"
      style={{ backgroundColor: '#13602C' }}
    >
      <Printer className="w-4 h-4" />{label}
    </button>
  )
}
