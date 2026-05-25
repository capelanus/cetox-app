import { requireNotAnalista, hasRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

const MODALIDAD_LABELS: Record<string, string> = {
  ANTICIPO_50_50: 'Anticipo 50/50',
  ANTICIPO_100: 'Anticipo 100%',
  CREDITO_100: 'Crédito 100%',
  CREDITO_50_50: 'Crédito 50/50',
  CREDITO_MENSUAL: 'Crédito mensual',
  CREDITO_QUINCENAL: 'Crédito quincenal',
  AL_CULMINAR: 'Al culminar',
}

export default async function ClientesPage() {
  const session = await requireNotAnalista()
  const clientes = await prisma.cliente.findMany({ orderBy: { razonSocial: 'asc' } })
  const canEdit = hasRol(session?.user.rol ?? '', 'GERENTE_TECNICO', 'DIRECTOR_CALIDAD', 'ADMINISTRACION')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        {canEdit && (
          <Link href="/clientes/nuevo">
            <Button style={{ backgroundColor: '#1F4E79' }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo cliente
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Razón social</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">RUC</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Dirección</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Modalidad</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.razonSocial}</td>
                <td className="px-4 py-3 text-slate-600">{c.ruc}</td>
                <td className="px-4 py-3 text-slate-600 max-w-48 truncate">{c.direccion}</td>
                <td className="px-4 py-3 text-slate-600">
                  {MODALIDAD_LABELS[c.modalidadPago] ?? c.modalidadPago}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={c.activo ? 'default' : 'secondary'}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <Link href={`/clientes/${c.id}`} className="text-blue-600 hover:underline text-sm">
                      Editar
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No hay clientes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
