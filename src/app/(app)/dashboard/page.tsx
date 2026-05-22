import { requireNotAnalista } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ClipboardList, TestTube, FileCheck } from 'lucide-react'

export default async function DashboardPage() {
  const session = await requireNotAnalista()
  const [cotPendientes, setsEnCurso, odasPendientes, informesRevisar] = await Promise.all([
    prisma.cotizacion.count({ where: { estado: { in: ['BORRADOR', 'EN_REVISION', 'ENVIADA'] } } }),
    prisma.sET.count({ where: { estado: { in: ['EMITIDA', 'EN_EJECUCION'] } } }),
    prisma.oDA.count({ where: { estado: { in: ['EMITIDA', 'RECIBIDA', 'EN_EJECUCION'] } } }),
    prisma.informe.count({ where: { estado: { in: ['BORRADOR', 'EN_REVISION_CALIDAD', 'EN_FIRMA_GERENCIA'] } } }),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Bienvenido, {session?.user.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Cotizaciones pendientes
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#1F4E79' }}>
              {cotPendientes}
            </div>
            <p className="text-xs text-slate-500 mt-1">Borrador / En revisión / Enviadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">SET en curso</CardTitle>
            <ClipboardList className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{setsEnCurso}</div>
            <p className="text-xs text-slate-500 mt-1">Emitidos / En ejecución</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">ODA pendientes</CardTitle>
            <TestTube className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{odasPendientes}</div>
            <p className="text-xs text-slate-500 mt-1">Emitidas / Recibidas / En ejecución</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Informes a revisar</CardTitle>
            <FileCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{informesRevisar}</div>
            <p className="text-xs text-slate-500 mt-1">Borrador / En revisión / En firma</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
