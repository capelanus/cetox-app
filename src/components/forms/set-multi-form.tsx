'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { crearSETsFromMuestras } from '@/app/actions/set'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'
import { OtraIndicacionFields } from './otra-indicacion-fields'

interface Muestra {
  id: string
  nombre: string
  orden: number
  items: { ensayo: { nombre: string; area: string }; tiempoEntregaDias: number; costo: number }[]
}

interface Props {
  cotizacionId: string
  muestras: Muestra[]
  cliente: { razonSocial: string; ruc: string; direccion: string }
  contacto: { contactoNombre: string | null; contactoEmail: string | null; contactoTelefono: string | null }
  numCotizacion: string
  moneda: string
}

const TIPO_ENVASE_OPTIONS = ['Envase original', 'Envase simple', 'Trasvasado', 'Ampolla', 'Bidón', 'Bolsa', 'Botella', 'Caja', 'Otro']
const MATERIAL_OPTIONS = ['Plástico', 'Vidrio', 'Metal / Aluminio', 'Cartón', 'Papel', 'Otro']
const ETIQUETA_OPTIONS = ['Comercial', 'Rótulo a mano', 'Rótulo a máquina', 'Otro']
const SEGURIDAD_OPTIONS = ['Precinto seguridad plástico', 'Tapa cerrada', 'Cerrado con sellado', 'Otro']

const AREA_LABELS: Record<string, string> = { Q: 'Química', B: 'Biología', M: 'Microbiología' }

function MuestraForm({ muestra, index }: { muestra: Muestra; index: number }) {
  const prefix = `${index}_`
  const [open, setOpen] = useState(index === 0)
  const [ingresoMuestra, setIngresoMuestra] = useState('')
  const [condAmb, setCondAmb] = useState('')
  const [tipoEnvase, setTipoEnvase] = useState('')
  const areas = [...new Set(muestra.items.map((i) => i.ensayo.area))].sort()

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header colapsable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#1F4E79] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {index + 1}
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {(muestra.nombre || `Muestra ${index + 1}`).split('\n')[0]}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {muestra.items.length} ensayo{muestra.items.length !== 1 ? 's' : ''}: {muestra.items.map(i => i.ensayo.nombre).join(', ')}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-5">
          {/* Ensayos (solo lectura) */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ensayos de esta muestra</p>
            <div className="space-y-1">
              {muestra.items.map((it, j) => (
                <div key={j} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{it.ensayo.nombre}</span>
                  <span className="text-slate-400 text-xs">{AREA_LABELS[it.ensayo.area] ?? it.ensayo.area} · {it.tiempoEntregaDias}d</span>
                </div>
              ))}
            </div>
          </div>

          {/* Datos del paciente */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Paciente <span className="font-normal normal-case">(solo si aplica)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombres y apellidos</Label>
                <Input name={`${prefix}nombrePaciente`} placeholder="Opcional" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Edad</Label>
                <Input name={`${prefix}edadPaciente`} placeholder="Ej: 35 años" className="text-sm" />
              </div>
            </div>
          </div>

          {/* Datos de la muestra */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Datos de la muestra</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Nombre comercial</Label>
                <Input name={`${prefix}nombreComercial`} defaultValue={muestra.nombre} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ingrediente activo</Label>
                <Input name={`${prefix}ingredienteActivo`} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Formulación</Label>
                <Input name={`${prefix}formulacion`} placeholder="p. ej. Solución acuosa 25%" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Número de lote</Label>
                <Input name={`${prefix}numeroLote`} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Peso / Volumen</Label>
                <Input name={`${prefix}pesoVolumen`} placeholder="p. ej. 500 mL" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fecha de fabricación</Label>
                <Input name={`${prefix}fechaFabricacion`} type="date" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fecha de vencimiento</Label>
                <Input name={`${prefix}fechaVencimiento`} type="date" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de muestra</Label>
                <Input name={`${prefix}tipoMuestra`} placeholder="p. ej. Producto químico" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ingreso de muestra</Label>
                <select
                  name={`${prefix}ingresoMuestra`}
                  value={ingresoMuestra}
                  onChange={(e) => setIngresoMuestra(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Personal">Personal</option>
                  <option value="Courier">Courier</option>
                  <option value="Otro">Otro</option>
                </select>
                {ingresoMuestra === 'Otro' && (
                  <Input name={`${prefix}ingresoMuestraOtro`} placeholder="Indicar método" className="mt-1 text-sm" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">N° de muestras</Label>
                <Input name={`${prefix}numeroMuestras`} placeholder="ej. 3 o 2 x 500 mL" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Devolución de muestra sobrante</Label>
                <select name={`${prefix}devolucionMuestra`} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Seleccionar...</option>
                  <option value="Si">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Condiciones ambientales</Label>
                <select
                  name={`${prefix}condicionesAmbientales`}
                  value={condAmb}
                  onChange={(e) => setCondAmb(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Temperatura ambiente">Temperatura ambiente</option>
                  <option value="Cadena de frío">Cadena de frío</option>
                  <option value="Otro">Otro</option>
                </select>
                {condAmb === 'Otro' && (
                  <Input name={`${prefix}condicionesAmbientalesOtro`} placeholder="Especificar condiciones..." className="mt-1 text-sm" />
                )}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Procedencia / Descripción</Label>
                <textarea
                  name={`${prefix}procedenciaDescripcion`}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[56px]"
                />
              </div>
              {areas.length > 0 ? (
                <OtraIndicacionFields areas={areas} prefix={prefix} labelSize="xs" />
              ) : (
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Otra indicación</Label>
                  <textarea
                    name={`${prefix}otraIndicacion`}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[56px]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Envase */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Descripción del envase</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de envase</Label>
                <select
                  name={`${prefix}tipoEnvase`}
                  value={tipoEnvase}
                  onChange={(e) => setTipoEnvase(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Seleccionar...</option>
                  {TIPO_ENVASE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                {tipoEnvase === 'Otro' && (
                  <Input name={`${prefix}tipoEnvaseOtro`} placeholder="Especificar" className="mt-1 text-sm" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Material</Label>
                <select name={`${prefix}materialEnvase`} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Seleccionar...</option>
                  {MATERIAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Etiqueta</Label>
                <select name={`${prefix}etiquetaEnvase`} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Seleccionar...</option>
                  {ETIQUETA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Seguridad</Label>
                <select name={`${prefix}seguridadEnvase`} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                  <option value="">Seleccionar...</option>
                  {SEGURIDAD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Observaciones</Label>
                <textarea
                  name={`${prefix}observaciones`}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[56px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function SetMultiForm({ cotizacionId, muestras, cliente, contacto, numCotizacion, moneda }: Props) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await crearSETsFromMuestras(formData)
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Hidden fields */}
      <input type="hidden" name="cotizacionId" value={cotizacionId} />
      <input type="hidden" name="muestraIds" value={JSON.stringify(muestras.map((m) => m.id))} />

      {/* Info del cliente */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm">Datos del cliente</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><p className="text-slate-500 text-xs">Cotización</p><p className="font-medium">{numCotizacion}</p></div>
          <div><p className="text-slate-500 text-xs">Cliente</p><p className="font-medium">{cliente.razonSocial}</p></div>
          <div><p className="text-slate-500 text-xs">RUC</p><p className="font-mono">{cliente.ruc}</p></div>
          {contacto.contactoNombre && <div><p className="text-slate-500 text-xs">Contacto</p><p>{contacto.contactoNombre}</p></div>}
          {contacto.contactoEmail && <div><p className="text-slate-500 text-xs">Email</p><p>{contacto.contactoEmail}</p></div>}
        </div>
      </div>

      {/* Fecha de ingreso compartida */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="space-y-1.5 flex-1 max-w-[200px]">
            <Label>Fecha de ingreso</Label>
            <Input name="fechaIngreso" type="date" defaultValue={today} />
          </div>
          <p className="text-sm text-slate-500 pt-6">Aplica a todos los SETs generados</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="flex items-center gap-2 px-1">
        <Package className="w-4 h-4 text-[#1F4E79]" />
        <p className="text-sm font-semibold text-slate-700">
          Se generarán <span className="text-[#1F4E79]">{muestras.length} SETs</span> — uno por muestra
        </p>
      </div>

      {/* Un formulario por muestra */}
      {muestras.map((muestra, i) => (
        <MuestraForm key={muestra.id} muestra={muestra} index={i} />
      ))}

      <Button type="submit" style={{ backgroundColor: '#1F4E79' }} disabled={loading} className="w-full">
        {loading ? 'Generando SETs...' : `Generar ${muestras.length} SET${muestras.length !== 1 ? 's' : ''}`}
      </Button>
    </form>
  )
}
