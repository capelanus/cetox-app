'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { actualizarSET } from '@/app/actions/set'
import { useRouter } from 'next/navigation'
import { OtraIndicacionFields } from '@/components/forms/otra-indicacion-fields'

interface SETData {
  id: string
  fechaIngreso: Date
  nombreComercial: string | null
  ingredienteActivo: string | null
  formulacion: string | null
  numeroLote: string | null
  fechaFabricacion: Date | null
  fechaVencimiento: Date | null
  pesoVolumen: string | null
  tipoMuestra: string | null
  observaciones: string | null
  nombrePaciente: string | null
  edadPaciente: string | null
  ingresoMuestra: string | null
  ingresoMuestraOtro: string | null
  numeroMuestras: string | null
  devolucionMuestra: string | null
  condicionesAmbientales: string | null
  procedenciaDescripcion: string | null
  otraIndicacion: string | null
  otraIndicacionQ: string | null
  otraIndicacionB: string | null
  otraIndicacionM: string | null
  tipoEnvase: string | null
  materialEnvase: string | null
  etiquetaEnvase: string | null
  seguridadEnvase: string | null
}

interface Props {
  set: SETData
  /** Áreas de laboratorio con ODAs asignadas a este SET */
  areas: string[]
}

const TIPO_ENVASE_OPTIONS = ['Envase original', 'Envase simple', 'Trasvasado', 'Ampolla', 'Bidón', 'Bolsa', 'Botella', 'Caja', 'Otro']
const MATERIAL_OPTIONS = ['Plástico', 'Vidrio', 'Metal / Aluminio', 'Cartón', 'Papel', 'Otro']
const ETIQUETA_OPTIONS = ['Comercial', 'Rótulo a mano', 'Rótulo a máquina', 'Otro']
const SEGURIDAD_OPTIONS = ['Precinto seguridad plástico', 'Tapa cerrada', 'Cerrado con sellado', 'Otro']

function toDateInput(d: Date | null | undefined): string {
  if (!d) return ''
  return new Date(d).toISOString().split('T')[0]
}

const COND_AMB_CONOCIDAS = ['Temperatura ambiente', 'Cadena de frío']

export function SetEditarForm({ set, areas }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [ingresoMuestra, setIngresoMuestra] = useState(set.ingresoMuestra ?? '')

  // Si el valor guardado no es una opción conocida, es un valor personalizado
  const condAmbInicial = set.condicionesAmbientales
  const condAmbEsPersonalizado = !!condAmbInicial && !COND_AMB_CONOCIDAS.includes(condAmbInicial)
  const [condAmb, setCondAmb] = useState(condAmbEsPersonalizado ? 'Otro' : (condAmbInicial ?? ''))

  const [tipoEnvase, setTipoEnvase] = useState(set.tipoEnvase ?? '')
  const [materialEnvase, setMaterialEnvase] = useState(set.materialEnvase ?? '')
  const [etiquetaEnvase, setEtiquetaEnvase] = useState(set.etiquetaEnvase ?? '')
  const [seguridadEnvase, setSeguridadEnvase] = useState(set.seguridadEnvase ?? '')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await actualizarSET(set.id, formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Datos del paciente */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm">
          Datos del paciente{' '}
          <span className="font-normal text-slate-400">(opcional — solo para muestras biológicas)</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombres y apellidos</Label>
            <Input name="nombrePaciente" defaultValue={set.nombrePaciente ?? ''} placeholder="Solo si aplica" />
          </div>
          <div className="space-y-2">
            <Label>Edad del paciente</Label>
            <Input name="edadPaciente" defaultValue={set.edadPaciente ?? ''} placeholder="Ej: 35 años" />
          </div>
        </div>
      </div>

      {/* Datos de la muestra */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm">Datos de la muestra</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Nombre comercial</Label>
            <textarea
              name="nombreComercial"
              rows={2}
              defaultValue={set.nombreComercial ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[60px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Ingrediente activo</Label>
            <Input name="ingredienteActivo" defaultValue={set.ingredienteActivo ?? ''} />
          </div>
          <div className="space-y-2">
            <Label>Formulación</Label>
            <Input name="formulacion" defaultValue={set.formulacion ?? ''} placeholder="p. ej. Solución acuosa 25%" />
          </div>
          <div className="space-y-2">
            <Label>Número de lote</Label>
            <Input name="numeroLote" defaultValue={set.numeroLote ?? ''} />
          </div>
          <div className="space-y-2">
            <Label>Peso / Volumen</Label>
            <Input name="pesoVolumen" defaultValue={set.pesoVolumen ?? ''} placeholder="p. ej. 500 mL" />
          </div>
          <div className="space-y-2">
            <Label>Fecha de fabricación</Label>
            <Input name="fechaFabricacion" type="date" defaultValue={toDateInput(set.fechaFabricacion)} />
          </div>
          <div className="space-y-2">
            <Label>Fecha de vencimiento</Label>
            <Input name="fechaVencimiento" type="date" defaultValue={toDateInput(set.fechaVencimiento)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de muestra</Label>
            <Input name="tipoMuestra" defaultValue={set.tipoMuestra ?? ''} placeholder="p. ej. Producto químico" />
          </div>
          <div className="space-y-2">
            <Label>Fecha de ingreso</Label>
            <Input name="fechaIngreso" type="date" defaultValue={toDateInput(set.fechaIngreso)} />
          </div>

          {/* Ingreso de muestra */}
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
              <Input
                name="ingresoMuestraOtro"
                defaultValue={set.ingresoMuestraOtro ?? ''}
                placeholder="Indicar método de ingreso"
                className="mt-1"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Número de muestras</Label>
            <Input name="numeroMuestras" defaultValue={set.numeroMuestras ?? ''} placeholder="ej. 3 o 2 x 500 mL" />
          </div>
          <div className="space-y-2">
            <Label>Devolución de muestra sobrante</Label>
            <select
              name="devolucionMuestra"
              defaultValue={set.devolucionMuestra ?? ''}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Seleccionar...</option>
              <option value="Si">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Condiciones ambientales</Label>
            <select
              name="condicionesAmbientales"
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
              <Input
                name="condicionesAmbientalesOtro"
                defaultValue={condAmbEsPersonalizado ? (condAmbInicial ?? '') : ''}
                placeholder="Especificar condiciones..."
                className="mt-1"
              />
            )}
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Procedencia / Características / Descripción</Label>
            <textarea
              name="procedenciaDescripcion"
              rows={2}
              defaultValue={set.procedenciaDescripcion ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[60px]"
            />
          </div>
          {areas.length > 0 ? (
            <OtraIndicacionFields
              areas={areas}
              defaultValues={{
                Q: set.otraIndicacionQ,
                B: set.otraIndicacionB,
                M: set.otraIndicacionM,
              }}
            />
          ) : (
            <div className="col-span-2 space-y-2">
              <Label>Otra indicación</Label>
              <textarea
                name="otraIndicacion"
                rows={2}
                defaultValue={set.otraIndicacion ?? ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[60px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Descripción del envase */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm">Descripción del envase</h2>
        <div className="grid grid-cols-2 gap-4">

          {/* Tipo de envase */}
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

          {/* Material */}
          <div className="space-y-2">
            <Label>Material</Label>
            <select
              name="materialEnvase"
              value={materialEnvase}
              onChange={(e) => setMaterialEnvase(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Seleccionar...</option>
              {MATERIAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {materialEnvase === 'Otro' && (
              <Input name="materialEnvaseOtro" placeholder="Especificar material" className="mt-1" />
            )}
          </div>

          {/* Etiqueta */}
          <div className="space-y-2">
            <Label>Etiqueta</Label>
            <select
              name="etiquetaEnvase"
              value={etiquetaEnvase}
              onChange={(e) => setEtiquetaEnvase(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Seleccionar...</option>
              {ETIQUETA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {etiquetaEnvase === 'Otro' && (
              <Input name="etiquetaEnvaseOtro" placeholder="Especificar tipo de etiqueta" className="mt-1" />
            )}
          </div>

          {/* Seguridad */}
          <div className="space-y-2">
            <Label>Seguridad</Label>
            <select
              name="seguridadEnvase"
              value={seguridadEnvase}
              onChange={(e) => setSeguridadEnvase(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Seleccionar...</option>
              {SEGURIDAD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {seguridadEnvase === 'Otro' && (
              <Input name="seguridadEnvaseOtro" placeholder="Especificar medida de seguridad" className="mt-1" />
            )}
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Observaciones</Label>
            <textarea
              name="observaciones"
              rows={3}
              defaultValue={set.observaciones ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-y min-h-[80px]"
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <Button type="submit" style={{ backgroundColor: '#1F4E79' }} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
