'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  firmarAction: (formData: FormData) => Promise<void>
  devolverAction: (formData: FormData) => Promise<void>
  observacionesIniciales?: string | null
  hideButtons?: boolean
}

export function CalidadReviewForm({ firmarAction, devolverAction, observacionesIniciales, hideButtons }: Props) {
  const [obs, setObs] = useState(observacionesIniciales ?? '')

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="obsCalidad">Observaciones / modificaciones <span className="text-slate-400 font-normal">(opcional)</span></Label>
        <Textarea
          id="obsCalidad"
          name="observacionesCalidad"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          rows={4}
          placeholder="Describa los cambios solicitados o la conformidad del documento..."
          className="resize-none"
        />
      </div>
      {!hideButtons && (
        <div className="flex gap-3">
          <form action={firmarAction}>
            <input type="hidden" name="observacionesCalidad" value={obs} />
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Aprobar y enviar a gerencia
            </Button>
          </form>
          <form action={devolverAction}>
            <input type="hidden" name="observacionesCalidad" value={obs} />
            <Button type="submit" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-2">
              <XCircle className="h-4 w-4" />
              No aprobar — devolver a administración
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
