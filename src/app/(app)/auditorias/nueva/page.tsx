import { requireRol } from '@/lib/roles'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { crearAuditoria } from '@/app/actions/auditorias'

export default async function NuevaAuditoriaPage() {
  await requireRol(['DIRECTOR_CALIDAD', 'COORDINADOR_CALIDAD'])

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/auditorias">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Nueva Auditoría</h1>
      </div>

      <form action={crearAuditoria} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Código *</label>
          <input
            name="codigo"
            required
            maxLength={60}
            placeholder="Ej. AUD-2026-001"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#13602C]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de auditoría *</label>
          <input
            name="fecha"
            type="date"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#13602C]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
          <textarea
            name="descripcion"
            rows={3}
            maxLength={500}
            placeholder="Descripción o alcance de la auditoría…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#13602C] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/auditorias">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
            Crear auditoría
          </Button>
        </div>
      </form>
    </div>
  )
}
