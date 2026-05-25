'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function SetPdfButton({ href, hayRevisadas }: { href: string; hayRevisadas: boolean }) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!hayRevisadas) {
      const ok = confirm(
        'Ningún ensayo tiene el check de revisión marcado.\n¿Deseas generar el PDF de todas formas? El documento se generará sin ensayos.'
      )
      if (!ok) e.preventDefault()
    }
  }

  return (
    <a href={href} download onClick={handleClick}>
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1" />
        Generar PDF
      </Button>
    </a>
  )
}
