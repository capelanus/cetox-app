'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function SetPdfButton({ href }: { href: string }) {
  return (
    <a href={href} download>
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1" />
        Generar PDF
      </Button>
    </a>
  )
}
