import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { formatMoneda } from '@/lib/format'

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

export default async function EnsayosPage() {
  const session = await requireNotAnalista()
  const ensayos = await prisma.ensayo.findMany({ orderBy: { codigo: 'asc' } })
  const canEdit = ['DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'ADMINISTRACION'].includes(session?.user.rol ?? '')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Catálogo de Ensayos</h1>
        {canEdit && (
          <Link href="/ensayos/nuevo">
            <Button style={{ backgroundColor: '#1F4E79' }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo ensayo
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Código</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Área</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Prefijo</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Costo USD</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Plazo</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Acreditado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ensayos.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{e.codigo}</td>
                <td className="px-4 py-3 font-medium">{e.nombre}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{AREA_LABELS[e.area] ?? e.area}</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{e.prefijoInforme}</td>
                <td className="px-4 py-3">
                  {e.costoUSD ? formatMoneda(e.costoUSD, 'USD') : '—'}
                </td>
                <td className="px-4 py-3">{e.tiempoEntregaDias} días</td>
                <td className="px-4 py-3">
                  {e.acreditadoINACAL ? (
                    <Badge className="bg-green-100 text-green-700">INACAL</Badge>
                  ) : (
                    <Badge variant="secondary">No acreditado</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <Link href={`/ensayos/${e.id}`} className="text-blue-600 hover:underline text-sm">
                      Editar
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
