'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Cliente, Ensayo } from '@/generated/prisma/client'
import { crearSETCero } from '@/app/actions/set'
import { toast } from 'sonner'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

const MOTIVOS = [
  {
    value: 'REENSAYO',
    label: 'Reensayo',
    desc: 'Previa evaluación — repetición de ensayo por invalidación o fallo técnico',
    color: '#4AC3B2',
  },
  {
    value: 'INGRESOS_INTERNOS',
    label: 'Ingresos internos',
    desc: 'SET a nombre de CETOX — ensayos para uso o demostración interna del laboratorio',
    color: '#13602C',
  },
  {
    value: 'MODIFICACION_SIN_COSTO',
    label: 'Modificación sin costo',
    desc: 'Modificaciones de informes requeridas por autoridad, por error nuestro o apoyo al cliente',
    color: '#13602C',
  },
]

const TIPO_ENVASE_OPTIONS = ['Envase original', 'Envase simple', 'Trasvasado', 'Ampolla', 'Bidón', 'Bolsa', 'Botella', 'Caja', 'Frasco', 'Galonera', 'Otro']
const MATERIAL_OPTIONS = ['Plástico', 'Vidrio', 'Metal / Aluminio', 'Cartón', 'Papel', 'Otro']
const ETIQUETA_OPTIONS = ['Comercial', 'Rótulo a mano', 'Rótulo a máquina', 'Otro']
const SEGURIDAD_OPTIONS = ['Precinto seguridad plástico', 'Tapa cerrada', 'Cerrado con sellado', 'Otro']

function OtroSelect({
  name,
  label,
  options,
  otroName,
  otroPlaceholder,
}: {
  name: string
  label: string
  options: string[]
  otroName: string
  otroPlaceholder?: string
}) {
  const [value, setValue] = useState('')
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
      >
        <option value="">Seleccionar...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {value === 'Otro' && (
        <Input name={otroName} placeholder={otroPlaceholder ?? 'Especificar...'} className="mt-1" />
      )}
    </div>
  )
}

interface Props {
  clientes: Cliente[]
  ensayos: Ensayo[]
}

export function SetCeroForm({ clientes, ensayos }: Props) {
  const [motivo, setMotivo] = useState('')
  const [selectedEnsayos, setSelectedEnsayos] = useState<Set<string>>(new Set())
  const [ingresoMuestra, setIngresoMuestra] = useState('')
  const [tipoEnvase, setTipoEnvase] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleEnsayo = (id: string) => {
    setSelectedEnsayos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!motivo) { toast.error('Selecciona el motivo del SET gratuito'); return }
    if (selectedEnsayos.size === 0) { toast.error('Selecciona al menos un ensayo'); return }
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    // Append selected ensayo IDs
    selectedEnsayos.forEach(id => formData.append('ensayoIds', id))
    try {
      await crearSETCero(formData)
    } catch (err) {
      if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw err
      toast.error('Error al crear el SET')
      setLoading(false)
    }
  }

  // Group ensayos by area
  const areas = [...new Set(ensayos.map(e => e.area))].sort()
  const AREA_LABELS: Record<string, string> = { B: 'Biológica', Q: 'Química', M: 'Microbiológica' }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Motivo ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" style={{ color: '#4AC3B2' }} />
          Motivo del SET gratuito *
        </h2>
        <input type="hidden" name="motivoCero" value={motivo} />
        <div className="grid grid-cols-1 gap-3">
          {MOTIVOS.map((m) => {
            const active = motivo === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMotivo(m.value)}
                className="flex items-start gap-3 p-4 rounded-lg border text-left transition-all"
                style={{
                  borderColor: active ? m.color : '#e2e8f0',
                  backgroundColor: active ? `${m.color}10` : 'white',
                  boxShadow: active ? `0 0 0 2px ${m.color}40` : undefined,
                }}
              >
                {active
                  ? <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: m.color }} />
                  : <Circle className="h-5 w-5 mt-0.5 flex-shrink-0 text-slate-300" />
                }
                <div>
                  <p className="font-semibold text-sm" style={{ color: active ? m.color : '#1e293b' }}>{m.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Cliente ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm">Datos del cliente</h2>
        <div className="space-y-2">
          <Label>Cliente *</Label>
          <select
            name="clienteId"
            required
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Seleccionar...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.razonSocial} — {c.ruc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Ensayos ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm flex items-center justify-between">
          <span>Ensayos a realizar *</span>
          {selectedEnsayos.size > 0 && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#DCF0E4', color: '#13602C' }}
            >
              {selectedEnsayos.size} seleccionado{selectedEnsayos.size > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <p className="text-xs text-slate-500 -mt-2">
          Los ensayos se crearán con costo $0.00 en las ODAs correspondientes.
        </p>
        {areas.map((area) => (
          <div key={area}>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: '#4AC3B2' }}
            >
              Área {AREA_LABELS[area] ?? area}
            </p>
            <div className="space-y-1">
              {ensayos.filter(e => e.area === area).map((ensayo) => {
                const selected = selectedEnsayos.has(ensayo.id)
                return (
                  <button
                    key={ensayo.id}
                    type="button"
                    onClick={() => toggleEnsayo(ensayo.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-all"
                    style={{
                      borderColor: selected ? '#4AC3B2' : '#e2e8f0',
                      backgroundColor: selected ? '#EAF4F4' : 'white',
                    }}
                  >
                    {selected
                      ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#13602C' }} />
                      : <Circle className="h-4 w-4 flex-shrink-0 text-slate-300" />
                    }
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{ensayo.nombre}</span>
                      <span className="text-slate-400 text-xs ml-2">{ensayo.codigo}</span>
                    </div>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                    >
                      $0.00
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Nombre del paciente ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm">
          Datos del paciente <span className="font-normal text-slate-400">(opcional — solo para muestras biológicas)</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombres y apellidos</Label>
            <Input name="nombrePaciente" placeholder="Solo si aplica" />
          </div>
          <div className="space-y-2">
            <Label>Edad del paciente</Label>
            <Input name="edadPaciente" placeholder="Ej: 35 años" />
          </div>
        </div>
      </div>

      {/* ── Datos de la muestra ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm">Datos de la muestra</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Nombre comercial</Label>
            <Input name="nombreComercial" />
          </div>
          <div className="space-y-2">
            <Label>Ingrediente activo</Label>
            <Input name="ingredienteActivo" />
          </div>
          <div className="space-y-2">
            <Label>Formulación</Label>
            <Input name="formulacion" placeholder="p. ej. Solución acuosa 25%" />
          </div>
          <div className="space-y-2">
            <Label>Número de lote</Label>
            <Input name="numeroLote" />
          </div>
          <div className="space-y-2">
            <Label>Peso / Volumen</Label>
            <Input name="pesoVolumen" placeholder="p. ej. 500 mL" />
          </div>
          <div className="space-y-2">
            <Label>Fecha de fabricación</Label>
            <Input name="fechaFabricacion" type="date" />
          </div>
          <div className="space-y-2">
            <Label>Fecha de vencimiento</Label>
            <Input name="fechaVencimiento" type="date" />
          </div>
          <div className="space-y-2">
            <Label>Tipo de muestra</Label>
            <Input name="tipoMuestra" placeholder="p. ej. Producto químico" />
          </div>
          <div className="space-y-2">
            <Label>Fecha de ingreso</Label>
            <Input name="fechaIngreso" type="date" defaultValue={today} />
          </div>
          <div className="space-y-2">
            <Label>Ingreso de muestra</Label>
            <select
              name="ingresoMuestra"
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
              <Input name="ingresoMuestraOtro" placeholder="Indicar método de ingreso" className="mt-1" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Número de muestras</Label>
            <Input name="numeroMuestras" type="text" placeholder="ej. 3 o 2 x 500 mL" />
          </div>
          <div className="space-y-2">
            <Label>Devolución de muestra sobrante</Label>
            <select name="devolucionMuestra" className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="">Seleccionar...</option>
              <option value="Si">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Condiciones ambientales</Label>
            <select name="condicionesAmbientales" className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option value="">Seleccionar...</option>
              <option value="Temperatura ambiente">Temperatura ambiente</option>
              <option value="Cadena de frío">Cadena de frío</option>
            </select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Procedencia / Características / Descripción</Label>
            <textarea
              name="procedenciaDescripcion"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[60px]"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Otra indicación</Label>
            <textarea
              name="otraIndicacion"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[60px]"
            />
          </div>
        </div>
      </div>

      {/* ── Descripción del envase ── */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm">Descripción del envase</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de envase</Label>
            <select
              name="tipoEnvase"
              value={tipoEnvase}
              onChange={(e) => setTipoEnvase(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Seleccionar...</option>
              {TIPO_ENVASE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {tipoEnvase === 'Otro' && (
              <Input name="tipoEnvaseOtro" placeholder="Especificar tipo de envase" className="mt-1" />
            )}
          </div>
          <OtroSelect name="materialEnvase" label="Material" options={MATERIAL_OPTIONS} otroName="materialEnvaseOtro" otroPlaceholder="Especificar material" />
          <OtroSelect name="etiquetaEnvase" label="Etiqueta" options={ETIQUETA_OPTIONS} otroName="etiquetaEnvaseOtro" otroPlaceholder="Especificar tipo de etiqueta" />
          <OtroSelect name="seguridadEnvase" label="Seguridad" options={SEGURIDAD_OPTIONS} otroName="seguridadEnvaseOtro" otroPlaceholder="Especificar medida de seguridad" />
          <div className="col-span-2 space-y-2">
            <Label>Observaciones</Label>
            <textarea
              name="observaciones"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[80px]"
            />
          </div>
        </div>
      </div>

      <Button type="submit" style={{ backgroundColor: '#13602C' }} disabled={loading}>
        {loading ? 'Creando...' : 'Crear SET sin costo'}
      </Button>
    </form>
  )
}
