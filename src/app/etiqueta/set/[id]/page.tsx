import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
// El paquete solo publica tipos por condición (node/browser); el subpath /node
// es el que resuelve TypeScript con moduleResolution "bundler".
import bwipjs from 'bwip-js/node'
import { formatFecha, formatNumSET } from '@/lib/format'
import { PrintButton } from '@/components/print-button'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

// Etiqueta de la muestra. Lleva un código de barras Code 128 con el código de
// la SET (p. ej. SET-0012-2026): es lo que lee el lector láser USB del
// counter, que "escribe" ese texto en el campo de lectura. El número impreso
// debajo es el mismo, por si hay que teclearlo a mano.
export default async function EtiquetaSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ copias?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const sp = await searchParams
  const copias = Math.min(40, Math.max(1, parseInt(sp.copias ?? '1') || 1))

  const set = await prisma.sET.findUnique({
    where: { id },
    include: {
      cliente: { select: { razonSocial: true } },
      odas: { select: { area: true }, orderBy: { numero: 'asc' } },
    },
  })
  if (!set || set.estado === 'ANULADO') notFound()

  const codigo = formatNumSET(set.numero, set.anio)
  const barras = bwipjs.toSVG({
    bcid: 'code128',
    text: codigo,
    height: 11,
    scale: 2,
    includetext: true,
    textxalign: 'center',
    textsize: 9,
  })
  const areas = [...new Set(set.odas.map(o => AREA_LABELS[o.area] ?? o.area))].join(' · ')

  return (
    <div className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <style>{`
        @page { size: auto; margin: 6mm; }
        @media print { .no-print { display: none !important; } .hoja { gap: 4mm !important; } }
        .barras svg { width: 100%; height: auto; display: block; }
      `}</style>

      <div className="no-print max-w-3xl mx-auto mb-5 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-800">Etiqueta de muestra · {codigo}</h1>
          <p className="text-sm text-slate-500">
            Pega una etiqueta por envase. Si son varios tubos, imprime varias copias: todas llevan el mismo código.
          </p>
        </div>
        <form className="flex items-center gap-2 text-sm">
          <label className="text-slate-600">Copias</label>
          <input
            type="number" name="copias" min={1} max={40} defaultValue={copias}
            className="w-20 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <button type="submit" className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            Actualizar
          </button>
        </form>
        <PrintButton label="Imprimir" />
      </div>

      <div className="hoja max-w-3xl mx-auto grid grid-cols-2 gap-4 print:grid-cols-2">
        {Array.from({ length: copias }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-300 rounded-lg p-3 flex flex-col gap-2 break-inside-avoid print:border-slate-400"
            style={{ minHeight: '42mm' }}
          >
            <div className="leading-tight">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Cetox Lab · Muestra</p>
              {set.nombreComercial && (
                <p className="text-xs font-semibold text-slate-800 truncate" title={set.nombreComercial}>{set.nombreComercial}</p>
              )}
              <p className="text-[10px] text-slate-600 truncate" title={set.cliente.razonSocial}>{set.cliente.razonSocial}</p>
              <p className="text-[10px] text-slate-600">
                {[set.tipoMuestra, set.numeroMuestras ? `${set.numeroMuestras} muestras` : null].filter(Boolean).join(' · ') || ' '}
              </p>
              <p className="text-[10px] text-slate-500">
                Ingreso {formatFecha(set.fechaIngreso)}{areas ? ` · ${areas}` : ''}
              </p>
            </div>
            {/* Zona tranquila a los lados: el lector láser la necesita para enganchar. */}
            <div className="barras px-3" dangerouslySetInnerHTML={{ __html: barras }} />
          </div>
        ))}
      </div>
    </div>
  )
}
