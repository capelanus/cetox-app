'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { REQUISITOS_MUESTRA } from '@/lib/constants'

/**
 * "Cantidad de muestra" y los requisitos que se imprimen en el PDF. Van juntos
 * porque en el documento salen uno debajo del otro, en el mismo bloque.
 */
export function MuestraFields({ defaults }: {
  defaults?: { cantidadMuestra?: string | null; requisitos?: string[] }
}) {
  // Sin datos previos se marcan todos: es como salía el PDF antes de poder elegir.
  const marcados = defaults?.requisitos ?? REQUISITOS_MUESTRA.map(r => r.key)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cantidad de muestra</Label>
        <Input
          name="cantidadMuestra"
          defaultValue={defaults?.cantidadMuestra ?? ''}
          placeholder="Ej: 500 g por muestra, 1 L, 2 unidades..."
        />
        <p className="text-xs text-slate-400">
          Aparece en el PDF. Si lo dejas vacío se imprime una raya para completar a mano.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Datos y requisitos necesarios</Label>
        <p className="text-xs text-slate-400">Solo se imprimen en el PDF los que dejes marcados.</p>
        <div className="space-y-1.5">
          {REQUISITOS_MUESTRA.map(r => (
            <label key={r.key} className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="requisitos"
                value={r.key}
                defaultChecked={marcados.includes(r.key)}
                className="w-4 h-4 mt-0.5 accent-[#13602C] shrink-0"
              />
              <span className="text-slate-700">{r.texto}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
