import { Label } from '@/components/ui/label'

const AREA_LABELS: Record<string, string> = {
  Q: 'Química',
  B: 'Biología',
  M: 'Microbiología',
}

const AREA_STYLES: Record<string, { badge: string; border: string; label: string }> = {
  Q: { badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-200 focus:ring-blue-300', label: 'text-blue-700' },
  B: { badge: 'bg-green-100 text-green-700', border: 'border-green-200 focus:ring-green-300', label: 'text-green-700' },
  M: { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200 focus:ring-purple-300', label: 'text-purple-700' },
}

interface Props {
  /** áreas únicas involucradas en el SET, p. ej. ['Q', 'B'] */
  areas: string[]
  /** prefijo de nombre de campo, para el formulario multi-muestra */
  prefix?: string
  /** valores por defecto al editar */
  defaultValues?: { Q?: string | null; B?: string | null; M?: string | null }
  /** tamaño del texto del label raíz */
  labelSize?: 'sm' | 'xs'
}

export function OtraIndicacionFields({
  areas,
  prefix = '',
  defaultValues = {},
  labelSize = 'sm',
}: Props) {
  if (areas.length === 0) return null

  // Clases de grid según cuántas áreas haya
  const gridCols =
    areas.length === 3 ? 'grid-cols-3' :
    areas.length === 2 ? 'grid-cols-2' :
    'grid-cols-1'

  return (
    <div className="col-span-2 space-y-2">
      <Label className={labelSize === 'xs' ? 'text-xs' : 'text-sm'}>
        Otras indicaciones{' '}
        <span className="font-normal text-slate-400 text-xs">
          (por laboratorio)
        </span>
      </Label>
      <div className={`grid ${gridCols} gap-3`}>
        {areas.map((area) => {
          const style = AREA_STYLES[area] ?? { badge: 'bg-gray-100 text-gray-700', border: '', label: 'text-gray-700' }
          return (
            <div key={area} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {AREA_LABELS[area] ?? area}
                </span>
              </div>
              <textarea
                name={`${prefix}otraIndicacion${area}`}
                rows={2}
                defaultValue={defaultValues[area as 'Q' | 'B' | 'M'] ?? ''}
                placeholder={`Indicaciones para ${AREA_LABELS[area] ?? area}...`}
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[64px] focus:outline-none focus:ring-2 ${style.border}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
