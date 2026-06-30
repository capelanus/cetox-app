import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, FileCheck, Calendar, Hash, Paperclip } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AuditoriasPage() {
  await requireRol(['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD', 'ADMINISTRACION', 'DIRECTOR_ADMINISTRACION'])

  const auditorias = await prisma.auditoria.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      creadoPor: { select: { nombre: true } },
      _count:    { select: { documentos: true } },
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Auditorías</h1>
          <p className="text-gray-500 text-sm">{auditorias.length} auditoria(s) registrada(s)</p>
        </div>
        <Link href="/auditorias/nueva">
          <Button className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            <Plus className="w-4 h-4 mr-2" />Nueva auditoría
          </Button>
        </Link>
      </div>

      {auditorias.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay auditorías registradas aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />Código
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Fecha</span>
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Descripción</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  <span className="flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" />Documentos</span>
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Creado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditorias.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/auditorias/${a.id}`} className="font-mono font-semibold text-[#13602C] hover:underline">
                      {a.codigo}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {format(a.fecha, "d 'de' MMMM yyyy", { locale: es })}
                  </td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                    {a.descripcion || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a._count.documentos > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a._count.documentos} doc{a._count.documentos !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{a.creadoPor.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
