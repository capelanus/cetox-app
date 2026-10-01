import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { formatFecha, formatNumSET } from '@/lib/format'
import { PrintButton } from '@/components/print-button'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

// Etiqueta de la muestra. El QR lleva el código de la SET (p. ej. SET-0012-2026)
// porque es lo que lee la tablet del counter; el texto impreso es el mismo
// código para que también sirva a ojo o con un lector USB.
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
  const qr = await QRCode.toDataURL(codigo, { width: 360, margin: 1, errorCorrectionLevel: 'M' })
  const areas = [...new Set(set.odas.map(o => AREA_LABELS[o.area] ?? o.area))].join(' · ')

  return (
    <div className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <style>{`
        @page { size: auto; margin: 6mm; }
        @media print { .no-print { display: none !important; } .hoja { gap: 4mm !important; } }
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
            className="bg-white border border-slate-300 rounded-lg p-3 flex gap-3 items-center break-inside-avoid print:border-slate-400"
            style={{ minHeight: '42mm' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={codigo} className="w-[34mm] h-[34mm] shrink-0" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Cetox Lab · Muestra</p>
              <p className="font-mono font-bold text-lg text-slate-900 tracking-wide">{codigo}</p>
              {set.nombreComercial && (
                <p className="text-xs font-semibold text-slate-800 truncate" title={set.nombreComercial}>{set.nombreComercial}</p>
              )}
              <p className="text-[10px] text-slate-600 truncate" title={set.cliente.razonSocial}>{set.cliente.razonSocial}</p>
              <p className="text-[10px] text-slate-600">
                {[set.tipoMuestra, set.numeroMuestras ? `${set.numeroMuestras} muestras` : null].filter(Boolean).join(' · ') || ' '}
              </p>
              <p className="text-[10px] text-slate-500">
                Ingreso {formatFecha(set.fechaIngreso)}{areas ? ` · ${areas}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
