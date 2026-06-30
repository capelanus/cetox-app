import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { FileText, FileImage, File as FileIcon, Download, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function iconForMime(mime: string | null) {
  if (mime?.startsWith('image/')) return FileImage
  if (mime === 'application/pdf') return FileText
  return FileIcon
}

export default async function DocumentosPersonalCalidadPage() {
  await requireRol(['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])

  // Calidad sees: docs with tipo Competencia técnica / Ficha de ingreso, OR explicitly shared
  const empleados = await prisma.empleado.findMany({
    where: {
      activo: true,
      documentos: {
        some: {
          OR: [
            { tipo: { in: ['Competencia técnica', 'Ficha de ingreso'] } },
            { visibleCalidad: true },
          ],
        },
      },
    },
    include: {
      documentos: {
        where: {
          OR: [
            { tipo: { in: ['Competencia técnica', 'Ficha de ingreso'] } },
            { visibleCalidad: true },
          ],
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>
          Documentos del Personal
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Competencias técnicas, fichas de ingreso y documentos compartidos por Administración
        </p>
      </div>

      {empleados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay documentos disponibles para Calidad aún.</p>
          <p className="text-gray-400 text-xs mt-1">Administración debe cargar los documentos y marcarlos como visibles.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {empleados.map(emp => (
            <div key={emp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#13602C]/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#13602C]" />
                </div>
                <div>
                  <span className="font-semibold text-gray-800 text-sm">{emp.nombre}</span>
                  {emp.cargo && <span className="text-gray-400 text-xs ml-2">— {emp.cargo}</span>}
                </div>
                <span className="ml-auto text-xs text-gray-400">{emp.documentos.length} doc{emp.documentos.length !== 1 ? 's' : ''}</span>
              </div>

              <ul className="divide-y divide-gray-50">
                {emp.documentos.map(doc => {
                  const Icon = iconForMime(doc.archivoTipo)
                  return (
                    <li key={doc.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 font-medium truncate">{doc.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.tipo && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                              {doc.tipo}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {format(doc.createdAt, "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                      </div>
                      <a
                        href={doc.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#13602C] hover:underline font-medium flex-shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Ver
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
