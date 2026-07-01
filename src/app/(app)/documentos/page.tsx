import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, File, Eye } from 'lucide-react'
import { getDepartamento } from '@/lib/calidad-constants'

const CATEGORIA_LABELS: Record<string, string> = {
  FORMATO:       'Formato',
  PROCEDIMIENTO: 'Procedimiento',
  INSTRUCTIVO:   'Instructivo',
}

const CATEGORIA_COLORS: Record<string, string> = {
  FORMATO:       'bg-blue-100 text-blue-700',
  PROCEDIMIENTO: 'bg-purple-100 text-purple-700',
  INSTRUCTIVO:   'bg-amber-100 text-amber-700',
}

function formatFechaCorta(d: Date) {
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function DocumentosPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { rol, area } = session.user
  const dept = getDepartamento(rol, area)
  if (!dept) redirect('/')

  const documentos = await prisma.documentoCalidad.findMany({
    where: { accesos: { some: { departamento: dept } } },
    include: { subidoPor: { select: { nombre: true } } },
    orderBy: [{ categoria: 'asc' }, { createdAt: 'desc' }],
  })

  const grupos: Record<string, typeof documentos> = {}
  for (const doc of documentos) {
    if (!grupos[doc.categoria]) grupos[doc.categoria] = []
    grupos[doc.categoria].push(doc)
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Documentos de Calidad</h1>
      <p className="text-sm text-slate-500 mb-6">
        Documentos compartidos por el área de Calidad — solo lectura.
      </p>

      {documentos.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-10 text-center text-slate-400">
          No hay documentos compartidos con tu departamento aún.
        </div>
      ) : (
        <div className="space-y-6">
          {['FORMATO', 'PROCEDIMIENTO', 'INSTRUCTIVO'].map(cat => {
            const docs = grupos[cat]
            if (!docs || docs.length === 0) return null
            return (
              <div key={cat} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b bg-slate-50 flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORIA_COLORS[cat]}`}>
                    {CATEGORIA_LABELS[cat]}
                  </span>
                  <span className="text-sm text-slate-500">{docs.length} documento{docs.length !== 1 ? 's' : ''}</span>
                </div>
                <ul className="divide-y">
                  {docs.map(doc => {
                    const esPdf = /\.pdf$/i.test(doc.archivoUrl.split('?')[0])
                    return (
                      <li key={doc.id} className="px-5 py-3.5 flex items-center gap-3">
                        {esPdf
                          ? <FileText className="w-5 h-5 text-red-500 shrink-0" />
                          : <File className="w-5 h-5 text-slate-400 shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{doc.nombre}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatFechaCorta(doc.createdAt)} · Calidad
                          </p>
                        </div>
                        <a
                          href={`/api/documentos-calidad/${doc.id}/ver`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#13602C] text-xs font-medium text-[#13602C] hover:bg-green-50 transition-colors shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Visualizar
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
