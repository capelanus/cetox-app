import { hasRol } from '@/lib/roles'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, QrCode, CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import { formatFecha, formatNumInforme, formatNumODA } from '@/lib/format'
import { ResultadoForm } from '@/components/forms/resultado-form'
import {
  firmarConformidadCalidad,
  firmarGerenciaTecnica,
  enviarAElaboracion,
  enviarARevision,
  subirInformeElaborado,
  subirDocumentoFirmado,
  devolverAAdministracion,
  subirInformeCorregidoCalidad,
} from '@/app/actions/informes'
import { CalidadReviewForm } from '@/components/forms/calidad-review-form'

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_ELABORACION: 'En elaboración',
  EN_REVISION_CALIDAD: 'En revisión calidad',
  EN_FIRMA_GERENCIA: 'En firma gerencia',
  FIRMADO: 'Firmado',
  ENTREGADO: 'Entregado',
}

export default async function InformeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Analistas solo pueden ver sus propios informes
  let session = await auth()
  if (!session) redirect('/login')
  const rol = session.user.rol ?? ''

  const informe = await prisma.informe.findUnique({
    where: { id },
    include: {
      oda: { include: { items: { include: { ensayo: true } }, set: { include: { cliente: true } } } },
      analista: true,
      certificadoQR: true,
    },
  })
  if (!informe) notFound()

  if (rol === 'ANALISTA' && session.user.id !== informe.analistaId) redirect('/oda')

  const esAnalista = (rol === 'ANALISTA' && session.user.id === informe.analistaId) || rol === 'SUPER_ADMIN'
  const esAdmin = hasRol(rol, 'ADMINISTRACION')
  const esCalidad = hasRol(rol, 'DIRECTOR_CALIDAD')
  const esGerente = hasRol(rol, 'GERENTE_TECNICO')

  const enviarElaboracionAction = enviarAElaboracion.bind(null, id)
  const enviarRevisionAction = enviarARevision.bind(null, id)
  const subirInformeAction = subirInformeElaborado.bind(null, id)
  const subirFirmadoAction = subirDocumentoFirmado.bind(null, id)
  const firmarCalidadAction = firmarConformidadCalidad.bind(null, id)
  const devolverAction = devolverAAdministracion.bind(null, id)
  const subirCorregidoCalidadAction = subirInformeCorregidoCalidad.bind(null, id)
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
            informe.estado === 'EN_FIRMA_GERENCIA' ? 'bg-blue-100 text-blue-700' :
            informe.estado === 'EN_ELABORACION' ? 'bg-orange-100 text-orange-700' : ''
          }
        >
          {ESTADO_LABELS[informe.estado] ?? informe.estado}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Flujo de aprobación */}
        {(() => {
          const pasos = [
            {
              label: 'Carga de resultado',
              depto: 'Analista',
              color: 'text-purple-700',
              dot: 'bg-purple-500',
              fecha: informe.createdAt,
              done: true,
              activo: informe.estado === 'BORRADOR',
            },
            {
              label: 'Elaboración de informe',
              depto: 'Administración',
              color: 'text-orange-700',
              dot: 'bg-orange-500',
              fecha: null,
              done: ['EN_REVISION_CALIDAD', 'EN_FIRMA_GERENCIA', 'FIRMADO', 'ENTREGADO'].includes(informe.estado),
              activo: informe.estado === 'EN_ELABORACION',
            },
            {
              label: 'Conformidad de calidad',
              depto: 'Director de Calidad',
              color: 'text-amber-700',
              dot: 'bg-amber-500',
              fecha: informe.firmaCalidad ?? null,
              done: !!informe.firmaCalidad,
              activo: informe.estado === 'EN_REVISION_CALIDAD',
            },
            {
              label: 'Firma de gerencia',
              depto: 'Gerente Técnico',
              color: 'text-blue-700',
              dot: 'bg-blue-500',
              fecha: informe.firmaGerencia ?? null,
              done: !!informe.firmaGerencia,
              activo: informe.estado === 'EN_FIRMA_GERENCIA' || !!informe.firmaGerencia,
            },
          ]
          return (
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h2 className="font-semibold text-slate-700 text-sm mb-4">Flujo de aprobación</h2>
              <div className="flex items-start gap-0">
                {pasos.map((paso, i) => (
                  <div key={i} className="flex-1 flex items-start">
                    <div className="flex flex-col items-center flex-1">
                      <div className="flex items-center w-full">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          paso.activo ? paso.dot : paso.done ? 'bg-slate-400' : 'bg-slate-100'
                        }`}>
                          {paso.done
                            ? <CheckCircle2 className="w-4 h-4 text-white" />
                            : paso.activo
                            ? <Clock className="w-3.5 h-3.5 text-white" />
                            : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                        </div>
                        {i < pasos.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 ${paso.done ? 'bg-slate-300' : 'bg-slate-200'}`} />
                        )}
                      </div>
                      <div className="mt-2 pr-2 w-full">
                        <p className={`text-xs font-semibold ${paso.activo ? paso.color : paso.done ? 'text-slate-500' : 'text-slate-400'}`}>
                          {paso.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${paso.activo ? paso.color : paso.done ? 'text-slate-400' : 'text-slate-300'}`}>
                          {paso.depto}
                        </p>
                        {paso.done && paso.fecha && (
                          <p className="text-xs text-slate-400 mt-0.5">{formatFecha(paso.fecha)}</p>
                        )}
                        {paso.activo && !paso.done && (
                          <p className={`text-xs mt-0.5 font-medium ${paso.color}`}>Pendiente</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

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
          {esAnalista && informe.estado === 'BORRADOR' ? (
            <ResultadoForm
              odaId={informe.odaId}
              initialTexto={informe.resultadoTexto ?? ''}
              initialImagenes={JSON.parse(informe.resultadoImagenes || '[]')}
              initialArchivos={JSON.parse(informe.resultadoArchivos || '[]')}
              buttonLabel="Guardar cambios"
            />
          ) : informe.resultadoTexto ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-800 bg-slate-50 rounded-lg p-4">
              {informe.resultadoTexto}
            </pre>
          ) : (
            <p className="text-slate-400 text-sm">Sin resultado cargado</p>
          )}
        </div>

        {/* Imágenes adjuntas — solo lectura, ocultas cuando el analista edita */}
        {!(esAnalista && informe.estado === 'BORRADOR') && (() => {
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

        {/* Revisión de calidad — sección para Director de Calidad */}
        {esCalidad && informe.estado === 'EN_REVISION_CALIDAD' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-5">
            <h2 className="font-semibold text-amber-700">Revisión de calidad</h2>

            {/* Visor embebido — siempre visible si hay documento */}
            {informe.archivoPdf && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Informe elaborado por Administración</p>
                  <a href={informe.archivoPdf} download>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1.5" />
                      Descargar informe
                    </Button>
                  </a>
                </div>
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(informe.archivoPdf)}&embedded=true`}
                  className="w-full rounded-lg border border-amber-200 bg-white"
                  style={{ height: '560px' }}
                  title="Informe de ensayo"
                />
              </div>
            )}

            {/* Observaciones y botones de acción */}
            <CalidadReviewForm
              firmarAction={firmarCalidadAction}
              devolverAction={devolverAction}
              observacionesIniciales={informe.observacionesCalidad}
            />

            {/* Cargar informe con correcciones propias */}
            <div className="border-t border-amber-200 pt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700">Cargar informe con correcciones</p>
              <p className="text-xs text-slate-500">Si realizaste correcciones directamente al documento, cárgalo aquí para enviarlo directo a gerencia.</p>
              <form action={subirCorregidoCalidadAction} className="space-y-3">
                <CalidadReviewForm
                  firmarAction={firmarCalidadAction}
                  devolverAction={devolverAction}
                  observacionesIniciales={informe.observacionesCalidad}
                  hideButtons
                />
                <div className="flex items-center gap-3">
                  <input
                    name="informeCorregido"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300 file:text-sm file:bg-white file:text-slate-700 hover:file:bg-slate-50"
                  />
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Subir correcciones y enviar a gerencia
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Observaciones de calidad — visible para administración cuando fue devuelto */}
        {esAdmin && informe.estado === 'EN_ELABORACION' && informe.observacionesCalidad && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Observaciones de Calidad
            </h2>
            <pre className="whitespace-pre-wrap text-sm text-red-800">{informe.observacionesCalidad}</pre>
          </div>
        )}

        {/* Firma de gerencia — sección para Gerente Técnico */}
        {esGerente && informe.estado === 'EN_FIRMA_GERENCIA' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-blue-700">Firma de gerencia técnica</h2>

            {/* Visor embebido del informe aprobado por calidad */}
            {informe.archivoPdf && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Informe aprobado por Calidad</p>
                  <a href={informe.archivoPdf} download>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1.5" />
                      Descargar informe
                    </Button>
                  </a>
                </div>
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(informe.archivoPdf)}&embedded=true`}
                  className="w-full rounded-lg border border-blue-200 bg-white"
                  style={{ height: '560px' }}
                  title="Informe aprobado"
                />
              </div>
            )}

            {/* Paso 1: subir documento firmado */}
            <div>
              <p className="text-sm text-slate-600 mb-2">1. Descarga el informe, fírmalo digitalmente y súbelo aquí (PDF).</p>
              <form action={subirFirmadoAction} className="flex items-center gap-3">
                <input
                  name="firmado"
                  type="file"
                  accept=".pdf"
                  className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300 file:text-sm file:bg-white file:text-slate-700 hover:file:bg-slate-50"
                />
                <Button type="submit" variant="outline" size="sm">Subir</Button>
              </form>
              {informe.archivoFirmadoGerencia && (
                <p className="text-sm text-green-700 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Documento firmado cargado — <a href={informe.archivoFirmadoGerencia} target="_blank" className="underline">ver documento</a>
                </p>
              )}
            </div>

            {/* Paso 3: generar QR y certificado — solo si hay documento firmado */}
            {informe.archivoFirmadoGerencia && (
              <div className="pt-2 border-t border-blue-200">
                <p className="text-sm text-slate-600 mb-2">2. Genera el QR y el certificado. El QR se incrustará en el documento firmado.</p>
                <form action={firmarGerenciaAction}>
                  <Button type="submit" style={{ backgroundColor: '#1F4E79' }}>
                    Firmar y generar QR
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Elaboración del informe — sección para Administración */}
        {esAdmin && informe.estado === 'EN_ELABORACION' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-orange-700">Elaboración del informe de ensayo</h2>

            {/* Paso 1: descargar plantilla */}
            <div>
              <p className="text-sm text-slate-600 mb-2">1. Descarga la plantilla Word con los datos del SET y completa los resultados.</p>
              <a href={`/api/informes/${id}/generar-informe-docx`} download>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar plantilla Word
                </Button>
              </a>
            </div>

            {/* Paso 2: subir informe elaborado */}
            <div>
              <p className="text-sm text-slate-600 mb-2">2. Una vez completado, sube el informe elaborado (PDF o Word).</p>
              <form action={subirInformeAction} className="flex items-center gap-3">
                <input
                  name="informe"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300 file:text-sm file:bg-white file:text-slate-700 hover:file:bg-slate-50"
                />
                <Button type="submit" variant="outline" size="sm">Subir</Button>
              </form>
              {informe.archivoPdf && (
                <p className="text-sm text-green-700 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Informe cargado — <a href={informe.archivoPdf} target="_blank" className="underline">ver documento</a>
                </p>
              )}
            </div>

            {/* Paso 3: enviar a calidad — solo si hay informe subido */}
            {informe.archivoPdf && (
              <div className="pt-2 border-t border-orange-200">
                <p className="text-sm text-slate-600 mb-2">3. Envía el informe a revisión de calidad.</p>
                <form action={enviarRevisionAction}>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                    Enviar a revisión calidad
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Workflow actions */}
        <div className="flex gap-3 flex-wrap">
          {esAnalista && informe.estado === 'BORRADOR' && informe.resultadoTexto && (
            <>
              <a href={`/api/informes/${id}/generar-docx`}>
                <Button variant="outline">Generar Word</Button>
              </a>
              <form action={enviarElaboracionAction}>
                <Button type="submit" style={{ backgroundColor: '#1F4E79' }}>
                  Enviar a elaboración
                </Button>
              </form>
            </>
          )}
          {esCalidad && informe.estado === 'EN_REVISION_CALIDAD' && (
            <div className="w-full" />
          )}
          {esGerente && informe.estado === 'EN_FIRMA_GERENCIA' && (
            <div className="w-full" />
          )}
        </div>
      </div>
    </div>
  )
}
