import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, QrCode } from 'lucide-react'
import { formatFecha, formatNumInforme, formatNumODA } from '@/lib/format'
import {
  firmarConformidadCalidad,
  firmarGerenciaTecnica,
  enviarARevision,
} from '@/app/actions/informes'
import { redirect } from 'next/navigation'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION_CALIDAD: 'En revisión calidad',
  EN_FIRMA_GERENCIA: 'En firma gerencia',
  FIRMADO: 'Firmado',
  ENTREGADO: 'Entregado',
}

export default async function InformeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireNotAnalista()
  const informe = await prisma.informe.findUnique({
    where: { id },
    include: {
      oda: { include: { items: { include: { ensayo: true } }, set: { include: { cliente: true } } } },
      analista: true,
      certificadoQR: true,
    },
  })
  if (!informe) notFound()

  const rol = session?.user.rol ?? ''
  const esAnalista = rol === 'ANALISTA' && session?.user.id === informe.analistaId
  const esCalidad = rol === 'DIRECTOR_CALIDAD'
  const esGerente = rol === 'GERENTE_TECNICO'

  const enviarAction = enviarARevision.bind(null, id)
  const firmarCalidadAction = firmarConformidadCalidad.bind(null, id)
  const firmarGerenciaAction = firmarGerenciaTecnica.bind(null, id)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/informes">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Informes</Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          {formatNumInforme(informe.prefijo, informe.numero, informe.anio)}
        </h1>
        <Badge
          className={
            informe.estado === 'FIRMADO' ? 'bg-green-100 text-green-700' :
            informe.estado === 'EN_REVISION_CALIDAD' ? 'bg-amber-100 text-amber-700' :
            informe.estado === 'EN_FIRMA_GERENCIA' ? 'bg-blue-100 text-blue-700' : ''
          }
        >
          {ESTADO_LABELS[informe.estado] ?? informe.estado}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Info */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Ensayos</p>
              <p className="font-medium">{informe.oda.items.map((i) => i.ensayo.nombre).join(', ')}</p>
            </div>
            <div>
              <p className="text-slate-500">ODA</p>
              <Link href={`/oda/${informe.odaId}`} className="text-blue-600 hover:underline">
                {formatNumODA(informe.oda.numero, informe.oda.anio)}
              </Link>
            </div>
            <div>
              <p className="text-slate-500">Cliente</p>
              <p className="font-medium">{informe.oda.set.cliente.razonSocial}</p>
            </div>
            <div>
              <p className="text-slate-500">Analista</p>
              <p className="font-medium">{informe.analista.nombre}</p>
            </div>
            {informe.firmaCalidad && (
              <div>
                <p className="text-slate-500">Revisión calidad</p>
                <p>{formatFecha(informe.firmaCalidad)}</p>
              </div>
            )}
            {informe.firmaGerencia && (
              <div>
                <p className="text-slate-500">Firma gerencia</p>
                <p>{formatFecha(informe.firmaGerencia)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-3">Resultado del ensayo</h2>
          {informe.resultadoTexto ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 rounded-lg p-4">
              {informe.resultadoTexto}
            </pre>
          ) : (
            <p className="text-slate-400 text-sm">Sin resultado cargado</p>
          )}
        </div>

        {/* Imágenes adjuntas */}
        {(() => {
          const imgs: string[] = JSON.parse(informe.resultadoImagenes || '[]')
          return imgs.length > 0 ? (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="font-semibold text-slate-700 mb-3">Imágenes del ensayo ({imgs.length})</h2>
              <div className="flex flex-wrap gap-3">
                {imgs.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={`Imagen ${i + 1}`}
                      className="h-32 w-32 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null
        })()}

        {/* Documentos */}
        {(informe.archivoDocx || informe.archivoPdf) && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 mb-3">Documentos</h2>
            <div className="flex gap-3">
              {informe.archivoDocx && (
                <a href={`/api/informes/${id}/generar-docx`}>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Word
                  </Button>
                </a>
              )}
              {informe.archivoPdf && (
                <a href={`/${informe.archivoPdf}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Certificado QR */}
        {informe.certificadoQR && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="h-5 w-5 text-green-700" />
              <h2 className="font-semibold text-green-700">Certificado QR generado</h2>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="text-slate-500">Código:</span> <span className="font-mono font-bold">{informe.certificadoQR.codigo}</span></p>
              <p><span className="text-slate-500">Clave de validación:</span> <span className="font-mono font-bold">{informe.certificadoQR.clave}</span></p>
              <p><span className="text-slate-500">URL pública:</span>{' '}
                <a href={informe.certificadoQR.qrUrl} className="text-blue-600 hover:underline" target="_blank">
                  {informe.certificadoQR.qrUrl}
                </a>
              </p>
              <p><span className="text-slate-500">Emitido:</span> {formatFecha(informe.certificadoQR.fechaEmision)}</p>
            </div>
            <a
              href={`/api/informes/${id}/generar-qr`}
              className="inline-block mt-3"
            >
              <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white">
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF con QR
              </Button>
            </a>
          </div>
        )}

        {/* Workflow actions */}
        <div className="flex gap-3 flex-wrap">
          {esAnalista && informe.estado === 'BORRADOR' && informe.resultadoTexto && (
            <>
              <a href={`/api/informes/${id}/generar-docx`}>
                <Button variant="outline">Generar Word</Button>
              </a>
              <form action={enviarAction}>
                <Button type="submit" style={{ backgroundColor: '#1F4E79' }}>
                  Enviar a revisión calidad
                </Button>
              </form>
            </>
          )}
          {esCalidad && informe.estado === 'EN_REVISION_CALIDAD' && (
            <form action={firmarCalidadAction}>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                Firmar conformidad calidad
              </Button>
            </form>
          )}
          {esGerente && informe.estado === 'EN_FIRMA_GERENCIA' && (
            <form action={firmarGerenciaAction}>
              <Button type="submit" style={{ backgroundColor: '#1F4E79' }}>
                Firmar y generar QR
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
