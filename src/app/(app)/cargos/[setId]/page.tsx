import { requireRol, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download } from 'lucide-react'
import { formatFecha, formatNumSET } from '@/lib/format'
import { crearCargoEntrega } from '@/app/actions/cargos'

export default async function CargoDetailPage({ params }: { params: Promise<{ setId: string }> }) {
  const session = await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO'])
  const puedeEditar = hasRol(session.user.rol, 'ADMINISTRACION')
  const { setId } = await params

  const set = await prisma.sET.findUnique({
    where: { id: setId },
    include: {
      cliente: true,
      odas: { include: { items: { include: { ensayo: true } }, informe: { include: { certificadoQR: true } } } },
      cargoEntrega: true,
    },
  })
  if (!set) notFound()

  const action = puedeEditar ? crearCargoEntrega.bind(null, setId) : null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cargos">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Cargos</Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Cargo de Entrega</h1>
        <a
          href={`/api/cargos/${setId}/generar-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#13602C] text-[#13602C] text-sm font-medium hover:bg-green-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </a>
      </div>

      {/* SET info */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4">Información del SET</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">SET</p>
            <p className="font-mono font-medium">{formatNumSET(set.numero, set.anio)}</p>
          </div>
          <div>
            <p className="text-slate-500">Cliente</p>
            <p className="font-medium">{set.cliente.razonSocial}</p>
          </div>
          <div>
            <p className="text-slate-500">Muestra</p>
            <p>{set.nombreComercial}</p>
          </div>
          <div>
            <p className="text-slate-500">Código muestra</p>
            <p className="font-mono">{set.codigoMuestra}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-slate-500 text-sm mb-2">Informes:</p>
          {set.odas.map((oda) => oda.informe && (
            <div key={oda.id} className="flex items-center gap-2 text-sm">
              <span className="font-mono">{oda.informe.prefijo}-{oda.informe.numero}-{oda.informe.anio}</span>
              <span className="text-slate-400">—</span>
              <span>{oda.items.map((i) => i.ensayo.nombre).join(', ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cargo form — editable solo por Administración */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Datos del receptor</h2>
        {puedeEditar && action ? (
          <form action={action} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recibidoPor">Recibido por (nombre)</Label>
                <Input
                  id="recibidoPor"
                  name="recibidoPor"
                  defaultValue={set.cargoEntrega?.recibidoPor ?? ''}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dniRecibe">DNI</Label>
                <Input
                  id="dniRecibe"
                  name="dniRecibe"
                  defaultValue={set.cargoEntrega?.dniRecibe ?? ''}
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaRecepcion">Fecha de recepción</Label>
                <Input
                  id="fechaRecepcion"
                  name="fechaRecepcion"
                  type="date"
                  defaultValue={
                    set.cargoEntrega?.fechaRecepcion
                      ? new Date(set.cargoEntrega.fechaRecepcion).toISOString().split('T')[0]
                      : new Date().toISOString().split('T')[0]
                  }
                />
              </div>
            </div>
            <Button type="submit" style={{ backgroundColor: '#13602C' }}>
              {set.cargoEntrega?.recibidoPor ? 'Actualizar cargo' : 'Registrar entrega'}
            </Button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500">Recibido por</p>
              <p className="font-medium">{set.cargoEntrega?.recibidoPor ?? '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">DNI</p>
              <p className="font-medium">{set.cargoEntrega?.dniRecibe ?? '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Fecha de recepción</p>
              <p className="font-medium">
                {set.cargoEntrega?.fechaRecepcion ? formatFecha(set.cargoEntrega.fechaRecepcion) : '—'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
