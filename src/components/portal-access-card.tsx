'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generarPasswordPortal, desactivarPortalCliente } from '@/app/actions/clientes'
import { KeyRound, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function PortalAccessCard({ clienteId, ruc, portalActivo }: { clienteId: string; ruc: string; portalActivo: boolean }) {
  const [pending, startTransition] = useTransition()
  const [nuevaPassword, setNuevaPassword] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  function handleGenerar() {
    startTransition(async () => {
      try {
        const password = await generarPasswordPortal(clienteId)
        setNuevaPassword(password)
        setCopiado(false)
      } catch {
        toast.error('No se pudo generar la contraseña')
      }
    })
  }

  function handleDesactivar() {
    startTransition(async () => {
      try {
        await desactivarPortalCliente(clienteId)
        setNuevaPassword(null)
        toast.success('Acceso al portal desactivado')
      } catch {
        toast.error('No se pudo desactivar el acceso')
      }
    })
  }

  async function handleCopiar() {
    if (!nuevaPassword) return
    await navigator.clipboard.writeText(nuevaPassword)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" style={{ color: '#13602C' }} />
          Portal del cliente
        </CardTitle>
        <CardDescription>
          Acceso externo para que el cliente siga sus muestras en{' '}
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">/portal</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Estado:{' '}
          <span className={`font-medium ${portalActivo ? 'text-emerald-600' : 'text-slate-400'}`}>
            {portalActivo ? 'Activo' : 'Sin activar'}
          </span>
        </p>
        <p className="text-sm text-slate-500">
          Usuario de acceso: <span className="font-mono">{ruc}</span>
        </p>

        {nuevaPassword && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1">
            <p className="text-xs text-emerald-700">
              Contraseña generada — cópiala ahora, no se volverá a mostrar:
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono font-semibold text-emerald-900">{nuevaPassword}</code>
              <Button type="button" variant="ghost" size="icon-sm" onClick={handleCopiar}>
                {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={handleGenerar} disabled={pending}>
            {portalActivo ? 'Regenerar contraseña' : 'Activar acceso'}
          </Button>
          {portalActivo && (
            <Button type="button" variant="ghost" size="sm" onClick={handleDesactivar} disabled={pending}>
              Desactivar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
