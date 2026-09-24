'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2, Paperclip, CheckCircle } from 'lucide-react'
import { crearCotizacionProveedor } from '@/app/actions/cotizaciones-proveedor'
import TotalesEditables from '@/components/forms/totales-editables'
import type { ItemExtraido, TotalesExtraidos } from '@/lib/extraer-cotizacion'

interface Requerimiento {
  id: string
  numero: number
  anio: number
  descripcion: string
  items: { descripcion: string; cantidad: number; unidad: string }[]
}

interface Proveedor {
  id: string
  razonSocial: string
  ruc: string
}

interface LineItem {
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
}

export default function NuevaCotizacionProveedorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reqParam = searchParams.get('req')

  const [requerimiento, setRequerimiento] = useState<Requerimiento | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [items, setItems] = useState<LineItem[]>([{ descripcion: '', cantidad: 1, unidad: 'Unidad', precioUnitario: 0 }])
  const [loading, setLoading] = useState(true)
  const [archivoUrl, setArchivoUrl] = useState<string>('')
  const [archivoNombre, setArchivoNombre] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [extrayendo, setExtrayendo] = useState(false)
  const [extraidos, setExtraidos] = useState<ItemExtraido[] | null>(null)
  const [totalesPdf, setTotalesPdf] = useState<TotalesExtraidos | null>(null)
  const [totalesAplicados, setTotalesAplicados] = useState<TotalesExtraidos | undefined>(undefined)
  const [mensajeExtraccion, setMensajeExtraccion] = useState('')
  const archivoUrlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!reqParam) {
      router.replace('/operaciones/requerimientos')
      return
    }
    Promise.all([
      fetch('/api/operaciones/requerimientos').then(r => r.json()),
      fetch('/api/operaciones/proveedores').then(r => r.json()),
    ]).then(([reqs, provs]: [Requerimiento[], Proveedor[]]) => {
      const req = reqs.find(r => r.id === reqParam)
      if (!req) {
        router.replace('/operaciones/requerimientos')
        return
      }
      setRequerimiento(req)
      setProveedores(provs)
      if (req.items?.length) {
        setItems(req.items.map(item => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          unidad: item.unidad,
          precioUnitario: 0,
        })))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [reqParam, router])

  const addItem = () => setItems(prev => [...prev, { descripcion: '', cantidad: 1, unidad: 'Unidad', precioUnitario: 0 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const subtotalItems = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setExtraidos(null)
    setMensajeExtraccion('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setArchivoUrl(data.url)
        setArchivoNombre(file.name)
      }
    } catch {
      alert('Error al subir el archivo')
    } finally {
      setUploading(false)
    }

    if (file.type !== 'application/pdf') {
      setMensajeExtraccion('Solo se pueden leer los productos desde un PDF con texto. Cárgalos a mano.')
      return
    }
    setExtrayendo(true)
    try {
      const { extraerTextoPdf, extraerItems, extraerTotales } = await import('@/lib/extraer-cotizacion')
      const texto = await extraerTextoPdf(file)
      const encontrados = extraerItems(texto)
      setTotalesPdf(extraerTotales(texto))
      if (encontrados.length === 0) {
        setMensajeExtraccion('No se reconocieron productos en el PDF (puede ser un escaneo sin texto). Cárgalos a mano.')
      } else {
        setExtraidos(encontrados)
      }
    } catch {
      setMensajeExtraccion('No se pudo leer el PDF. Carga los productos a mano.')
    } finally {
      setExtrayendo(false)
    }
  }

  function usarExtraidos() {
    if (!extraidos) return
    setItems(extraidos.map(it => ({
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      unidad: it.unidad,
      precioUnitario: it.precioUnitario,
    })))
    setExtraidos(null)
    // Si el PDF declara sus propios totales se usan tal cual: son los que tienen
    // que cuadrar con la factura, aunque no salgan de multiplicar las líneas.
    if (totalesPdf && Object.values(totalesPdf).some(v => v !== undefined)) {
      setTotalesAplicados(totalesPdf)
      setMensajeExtraccion('Productos y totales cargados desde el PDF. Revísalos antes de guardar.')
    } else {
      setMensajeExtraccion('Productos cargados desde el PDF. Revísalos antes de guardar.')
    }
  }

  async function handleSubmit(formData: FormData) {
    formData.set('items', JSON.stringify(items))
    if (archivoUrl) formData.set('archivoUrl', archivoUrl)
    await crearCotizacionProveedor(formData)
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>
  if (!requerimiento) return null

  const backHref = `/operaciones/requerimientos/${requerimiento.id}`

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backHref}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver al requerimiento</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Nueva Cotización de Proveedor</h1>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Información general</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Requerimiento locked — always from URL param */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requerimiento</label>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">
                REQ-{String(requerimiento.numero).padStart(4, '0')}-{requerimiento.anio} — {requerimiento.descripcion}
              </div>
              <input type="hidden" name="requerimientoId" value={requerimiento.id} />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select name="proveedorId" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.razonSocial} ({prov.ruc})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="moneda" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                <option value="PEN">PEN (Soles)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plazo de entrega (días)</label>
              <input name="plazoEntregaDias" type="number" min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones de pago</label>
              <input name="condicionesPago" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validez (días)</label>
              <input name="validezDias" type="number" min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea name="observaciones" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>

            {/* File upload */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Paperclip className="w-3.5 h-3.5 inline-block mr-1" />
                Adjuntar cotización (PDF / imagen)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#13602C] file:text-white hover:file:bg-[#0e4a21]"
              />
              {uploading && <p className="text-xs text-gray-500 mt-1">Subiendo archivo...</p>}
              {archivoUrl && !uploading && (
                <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {archivoNombre} — subido correctamente
                </p>
              )}
              {extrayendo && <p className="text-xs text-gray-500 mt-1">Leyendo productos del PDF...</p>}
              {mensajeExtraccion && <p className="text-xs text-gray-500 mt-1">{mensajeExtraccion}</p>}

              {extraidos && (
                <div className="mt-3 border border-amber-300 bg-amber-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    Se detectaron {extraidos.length} producto(s) en el PDF
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                    {extraidos.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {it.confiable
                          ? <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
                          : <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" title="Revisar: cantidad × precio no cuadra con el importe" />}
                        <span className="flex-1 truncate text-gray-700">{it.descripcion}</span>
                        <span className="font-mono text-gray-500 whitespace-nowrap">
                          {it.cantidad} {it.unidad} × {it.precioUnitario.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" onClick={usarExtraidos} className="bg-[#13602C] hover:bg-[#0e4a21] text-white">
                      Usar estos productos
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setExtraidos(null)}>Descartar</Button>
                    <span className="text-xs text-amber-800">Reemplaza los ítems actuales; siempre revisa antes de guardar.</span>
                  </div>
                </div>
              )}

              <input ref={archivoUrlRef} type="hidden" name="archivoUrl" value={archivoUrl} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Ítems cotizados</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />Agregar ítem
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                <div className="col-span-4">
                  <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                  <input
                    value={item.descripcion}
                    onChange={e => updateItem(i, 'descripcion', e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={item.cantidad}
                    min={0.01}
                    step={0.01}
                    onChange={e => updateItem(i, 'cantidad', parseFloat(e.target.value))}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Unidad</label>
                  <input
                    value={item.unidad}
                    onChange={e => updateItem(i, 'unidad', e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Precio unit.</label>
                  <input
                    type="number"
                    value={item.precioUnitario}
                    min={0}
                    step={0.01}
                    onChange={e => updateItem(i, 'precioUnitario', parseFloat(e.target.value))}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
                  <p className="text-sm font-mono text-gray-700 py-1.5">{(item.cantidad * item.precioUnitario).toFixed(2)}</p>
                </div>
                <div className="col-span-1 pt-5">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <TotalesEditables
            key={totalesAplicados ? 'pdf' : 'items'}
            subtotalItems={subtotalItems}
            defaults={totalesAplicados}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">Registrar cotización</Button>
          <Link href={backHref}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
