'use client'

import { ArrowLeft } from 'lucide-react'

export function CloseButton() {
  return (
    <button
      onClick={() => window.close()}
      className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Cerrar
    </button>
  )
}
