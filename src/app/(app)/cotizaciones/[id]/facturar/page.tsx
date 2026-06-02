import { requireRol } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatNumCotizacion } from '@/lib/format'
import { FacturarForm, type ItemFacturable } from './facturar-form'

export default async function FacturarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRol(['ADMINISTRACION', 'DIRECTOR_CALIDAD', 'GERENTE_TECNICO', 'COORDINADOR_CALIDAD'])

  const cot = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      cliente: true,
      items: {
        include: { ensayo: true },
        orderBy: { id: 'asc' },
      },
      muestras: {
        include: {
          items: { include: { ensayo: true }, orderBy: { id: 'asc' } },
        },
        orderBy: { orden: 'asc' },
      },
    },
  })
  if (!cot) notFound()
  if (cot.estado !== 'ACEPTADA') notFound()

  // Construir lista de ítems facturables
  const moneda = (cot.moneda === 'PEN' ? 'PEN' : 'USD') as 'USD' | 'PEN'
  let items: ItemFacturable[]

  if (cot.muestras.length > 0) {
    // Multi-muestra
    items = cot.muestras.flatMap(m =>
      m.items.map(it => ({
        itemId:  it.id,
        nombre:  it.ensayo.nombre,
        muestra: m.nombre,
        costo:   it.costo,
        moneda,
      }))
    )
  } else {
    // Items directos (legacy)
    items = cot.items.map(it => ({
      itemId:  it.id,
      nombre:  it.ensayo.nombre,
      muestra: null,
      costo:   it.costo,
      moneda,
    }))
  }

  return (
    <FacturarForm
      cotizacionId={cot.id}
      numCotizacion={formatNumCotizacion(cot.numero, cot.anio, cot.sufijo)}
      clienteNombre={cot.cliente.razonSocial}
      items={items}
      igvRate={0.18}
    />
  )
}
