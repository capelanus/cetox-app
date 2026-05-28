'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Paperclip, CheckCircle, Lightbulb } from 'lucide-react'
import { registrarFactura } from '@/app/actions/facturas-proveedor'

interface OC {
  id: string
  numero: number
  anio: number
  proveedor: { razonSocial: string }
  total: number
  moneda: string
}

interface Sugerencias {
  serie?: string
  numero?: string
  fecha?: string
  total?: string
}

export default function NuevaFacturaPage() {
  const searchParams = useSearchParams()
  const ocParam = searchParams.get('oc')

  const [ocs, setOcs] = useState<OC[]>([])
  const [selectedOC, setSelectedOC] = useState<string>(ocParam || '')
  const [subtotal, setSubtotal] = useState('')
  const [loading, setLoading] = useState(true)

  // File upload state
  const [archivoUrl, setArchivoUrl] = useState<string>('')
  const [archivoNombre, setArchivoNombre] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [sugerencias, setSugerencias] = useState<Sugerencias>({})
  const [sugerenciasAceptadas, setSugerenciasAceptadas] = useState<Set<keyof Sugerencias>>(new Set())

  // Field refs for pre-filling
  const serieRef = useRef<HTMLInputElement>(null)
  const numeroRef = useRef<HTMLInputElement>(null)
  const fechaRef = useRef<HTMLInputElement>(null)

  const igv = subtotal ? (parseFloat(subtotal) * 0.18).toFixed(2) : '0.00'
  const total = subtotal ? (parseFloat(subtotal) * 1.18).toFixed(2) : '0.00'

  useEffect(() => {
    fetch('/api/operaciones/ordenes-compra')
      .then(r => r.json())
      .then((data: OC[]) => {
        setOcs(data)
        setLoading(false)
        if (ocParam) {
          const oc = data.find((o: OC) => o.id === ocParam)
          if (oc) {
            const sub = (oc.total / 1.18).toFixed(2)
            setSubtotal(sub)
          }
        }
      })
      .catch(() => setLoading(false))
  }, [ocParam])

  function extraerSugerencias(texto: string): Sugerencias {
    const sug: Sugerencias = {}

    // Serie-Número: e.g. F001-00001234 or F001 00001234
    const serieNumMatch = texto.match(/([A-Z]{1,4}[\s-]?\d{1,4})[\s-]+(\d{1,10})/i)
    if (serieNumMatch) {
      sug.serie = serieNumMatch[1].replace(/\s/g, '').toUpperCase()
      sug.numero = serieNumMatch[2]
    }

    // Date DD/MM/YYYY
    const fechaMatch = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (fechaMatch) {
      // Convert to YYYY-MM-DD for date input
      sug.fecha = `${fechaMatch[3]}-${fechaMatch[2]}-${fechaMatch[1]}`
    }

    // Total
    const totalMatch = texto.match(/TOTAL[:\s]+S?\/?\s*([\d,]+\.?\d*)/i)
    if (totalMatch) {
      sug.total = totalMatch[1].replace(/,/g, '')
    }

    return sug
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Try to extract text for hints (works for text-based PDFs or images with text)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const texto = ev.target?.result as string ?? ''
      const sug = extraerSugerencias(texto)
      if (Object.keys(sug).length > 0) {
        setSugerencias(sug)
      }
    }
    reader.readAsText(file)

    // Upload file
    setUploading(true)
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
  }

  function aceptarSugerencia(campo: keyof Sugerencias) {
    const valor = sugerencias[campo]
    if (!valor) return
    setSugerenciasAceptadas(prev => new Set([...prev, campo]))

    if (campo === 'serie' && serieRef.current) {
      serieRef.current.value = valor
    }
    if (campo === 'numero' && numeroRef.current) {
      numeroRef.current.value = valor
    }
    if (campo === 'fecha' && fechaRef.current) {
      fechaRef.current.value = valor
    }
    if (campo === 'total') {
      // total from PDF is likely total with IGV, calc subtotal
      const t = parseFloat(valor)
      if (!isNaN(t)) {
        setSubtotal((t / 1.18).toFixed(2))
      }
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando...</div>

  const haySugerencias = Object.keys(sugerencias).length > 0

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/operaciones/facturas">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Volver</Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#13602C]" style={{ fontFamily: 'Oswald, sans-serif' }}>Registrar Factura</h1>
      </div>

      {/* PDF upload — AT THE TOP */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-400" />
          Adjuntar factura PDF
        </h2>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          disabled={uploading}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#13602C] file:text-white hover:file:bg-[#0e4a21]"
        />
        {uploading && <p className="text-xs text-gray-500">Subiendo archivo...</p>}
        {archivoUrl && !uploading && (
          <p className="text-xs text-green-700 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {archivoNombre} — subido correctamente.{' '}
            <a href={archivoUrl} target="_blank" rel="noopener noreferrer" className="underline">Ver</a>
          </p>
        )}

        {/* Suggestions box */}
        {haySugerencias && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium text-yellow-800 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" />
              Sugerencias extraídas del documento — haz clic para aplicar
            </p>
            <div className="flex flex-wrap gap-2">
              {sugerencias.serie && (
                <button
                  type="button"
                  onClick={() => aceptarSugerencia('serie')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sugerenciasAceptadas.has('serie') ? 'bg-green-100 border-green-300 text-green-700' : 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'}`}
                >
                  {sugerenciasAceptadas.has('serie') ? '✓ ' : ''}Serie: {sugerencias.serie}
                </button>
              )}
              {sugerencias.numero && (
                <button
                  type="button"
                  onClick={() => aceptarSugerencia('numero')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sugerenciasAceptadas.has('numero') ? 'bg-green-100 border-green-300 text-green-700' : 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'}`}
                >
                  {sugerenciasAceptadas.has('numero') ? '✓ ' : ''}N°: {sugerencias.numero}
                </button>
              )}
              {sugerencias.fecha && (
                <button
                  type="button"
                  onClick={() => aceptarSugerencia('fecha')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sugerenciasAceptadas.has('fecha') ? 'bg-green-100 border-green-300 text-green-700' : 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'}`}
                >
                  {sugerenciasAceptadas.has('fecha') ? '✓ ' : ''}Fecha: {sugerencias.fecha}
                </button>
              )}
              {sugerencias.total && (
                <button
                  type="button"
                  onClick={() => aceptarSugerencia('total')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sugerenciasAceptadas.has('total') ? 'bg-green-100 border-green-300 text-green-700' : 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'}`}
                >
                  {sugerenciasAceptadas.has('total') ? '✓ ' : ''}Total: {sugerencias.total}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={registrarFactura} className="space-y-4">
          {/* Hidden field for archivoUrl */}
          <input type="hidden" name="archivoUrl" value={archivoUrl} />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Compra *</label>
              <select
                name="ordenCompraId"
                required
                value={selectedOC}
                onChange={e => setSelectedOC(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]"
              >
                <option value="">Seleccionar OC...</option>
                {ocs.map(oc => (
                  <option key={oc.id} value={oc.id}>
                    OC-{String(oc.numero).padStart(4, '0')}-{oc.anio} — {oc.proveedor.razonSocial}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
              <input
                ref={serieRef}
                name="serie"
                placeholder="F001"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] ${sugerencias.serie && !sugerenciasAceptadas.has('serie') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
              <input
                ref={numeroRef}
                name="numero"
                required
                placeholder="00001234"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] ${sugerencias.numero && !sugerenciasAceptadas.has('numero') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="moneda" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]">
                <option value="PEN">PEN (Soles)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de emisión *</label>
              <input
                ref={fechaRef}
                name="fechaEmision"
                type="date"
                required
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] ${sugerencias.fecha && !sugerenciasAceptadas.has('fecha') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha vencimiento</label>
              <input name="fechaVencimiento" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal *</label>
              <input
                name="subtotal"
                type="number"
                required
                min={0}
                step={0.01}
                value={subtotal}
                onChange={e => setSubtotal(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#13602C] ${sugerencias.total && !sugerenciasAceptadas.has('total') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IGV (calculado)</label>
              <input
                name="igv"
                type="number"
                value={igv}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <div className="text-sm space-y-1 min-w-[180px]">
                <div className="flex justify-between font-bold text-[#13602C]">
                  <span>Total:</span>
                  <span className="font-mono">{total}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="bg-[#13602C] hover:bg-[#0e4a21] text-white">Registrar factura</Button>
            <Link href="/operaciones/facturas">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
