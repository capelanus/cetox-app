'use client'

import { XCircle } from 'lucide-react'

interface Props {
  action: () => Promise<void>
}

export function AnularBtn({ action }: Props) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all"
        style={{
          backgroundColor: '#fee2e2',
          color: '#7f1d1d',
          border: '1.5px solid #fca5a5',
        }}
        onClick={e => {
          if (!confirm('¿Anular esta factura? Esta acción no se puede deshacer.')) {
            e.preventDefault()
          }
        }}
      >
        <XCircle className="h-4 w-4" />
        Anular factura
      </button>
    </form>
  )
}
