'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Fecha de fabricación/vencimiento con la opción "Solo mes y año": algunos
 * clientes la declaran completa y otros como "agosto 2026". Envía `name`
 * (aaaa-mm-dd o aaaa-mm) y `${name}SoloMes` ("1" si es solo mes y año).
 */
export function CampoFechaMuestra({
  name, label, defaultValue, defaultSoloMes = false, compacto = false,
}: {
  name: string
  label: string
  defaultValue?: Date | string | null
  defaultSoloMes?: boolean
  compacto?: boolean
}) {
  const [soloMes, setSoloMes] = useState(defaultSoloMes)
  const iso = defaultValue ? new Date(defaultValue).toISOString() : ''
  const valorInicial = iso ? (soloMes ? iso.slice(0, 7) : iso.slice(0, 10)) : ''

  return (
    <div className={compacto ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex items-center justify-between gap-2">
        <Label className={compacto ? 'text-xs' : undefined}>{label}</Label>
        <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloMes}
            onChange={e => setSoloMes(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#13602C]"
          />
          Solo mes y año
        </label>
      </div>
      {/* key fuerza a recrear el input al cambiar de tipo: date y month no
          aceptan el mismo formato de valor. */}
      <Input
        key={soloMes ? 'mes' : 'dia'}
        name={name}
        type={soloMes ? 'month' : 'date'}
        defaultValue={valorInicial ? (soloMes ? valorInicial.slice(0, 7) : valorInicial) : undefined}
        className={compacto ? 'text-sm' : undefined}
      />
      <input type="hidden" name={`${name}SoloMes`} value={soloMes ? '1' : ''} />
    </div>
  )
}
