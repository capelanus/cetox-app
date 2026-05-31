import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ArrowDownCircle, Banknote } from 'lucide-react'
import { CajaChicaView, GastoRow, IngresoRow } from './caja-chica-view'

export default async function CajaChicaPage() {
  const session = await requireRol(['DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION'])
  const readonly = session.user.rol === 'DIRECTOR_ADMINISTRACION'

  const [gastos, ingresos] = await Promise.all([
    prisma.cajaChicaGasto.findMany({ orderBy: { fecha: 'desc' } }),
    prisma.cajaChicaIngreso.findMany({ orderBy: { fecha: 'desc' } }),
  ])

  const gastosSerialized: GastoRow[] = gastos.map((g) => ({
    id:              g.id,
    fecha:           g.fecha.toISOString(),
    concepto:        g.concepto,
    monto:           g.monto,
    moneda:          g.moneda,
    categoria:       g.categoria,
    proveedorNombre: g.proveedorNombre,
    proveedorRuc:    g.proveedorRuc,
    numeroFactura:   g.numeroFactura,
    comprobante:     g.comprobante,
    notas:           g.notas,
  }))

  const ingresosSerialized: IngresoRow[] = ingresos.map((i) => ({
    id:          i.id,
    fecha:       i.fecha.toISOString(),
    descripcion: i.descripcion,
    monto:       i.monto,
    moneda:      i.moneda,
  }))

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Caja Chica</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registro de ingresos y gastos menores</p>
        </div>
        <div className="flex gap-2">
          <Link href="/caja-chica/peticiones">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <Banknote className="h-4 w-4 mr-2" />
              Ver Peticiones
            </Button>
          </Link>
          {!readonly && (
            <>
              <Link href="/caja-chica/nuevo-ingreso">
                <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400">
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Registrar ingreso
                </Button>
              </Link>
              <Link href="/caja-chica/nuevo">
                <Button style={{ backgroundColor: '#13602C' }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar gasto
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <CajaChicaView gastos={gastosSerialized} ingresos={ingresosSerialized} readonly={readonly} />
    </div>
  )
}
