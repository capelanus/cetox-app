'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { enviarAElaboracion } from '@/app/actions/informes'

export function EnviarElaboracionButton({ informeId }: { informeId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    const ok = confirm(
      '¿Enviar informe a elaboración?\n\nUna vez enviado ya no podrás modificar el texto ni los archivos adjuntos.'
    )
    if (!ok) return
    startTransition(() => enviarAElaboracion(informeId))
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={pending}
      style={{ backgroundColor: '#1F4E79' }}
    >
      {pending ? 'Enviando…' : 'Enviar a elaboración'}
    </Button>
  )
}
