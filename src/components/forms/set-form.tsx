'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { crearSET } from '@/app/actions/set'

interface ContactoCotizacion {
  contactoNombre: string | null
  contactoEmail: string | null
  contactoTelefono: string | null
}

interface ClienteInfo {
  razonSocial: string
  ruc: string
  direccion: string
}

interface Props {
  cotizacionId: string
  cliente: ClienteInfo
  contacto: ContactoCotizacion
  numCotizacion: string
}

const TIPO_ENVASE_OPTIONS = ['Envase original', 'Envase simple', 'Trasvasado', 'Ampolla', 'Bidón', 'Bolsa', 'Botella', 'Caja', 'Otro']
const MATERIAL_OPTIONS = ['Plástico', 'Vidrio', 'Metal / Aluminio', 'Cartón', 'Papel', 'Otro']
const ETIQUETA_OPTIONS = ['Comercial', 'Rótulo a mano', 'Rótulo a máquina', 'Otro']
const SEGURIDAD_OPTIONS = ['Precinto seguridad plástico', 'Tapa cerrada', 'Cerrado con sellado', 'Otro']

function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select name={name} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
        <option value="">Seleccionar...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export function SetForm({ cotizacionId, cliente, contacto, numCotizacion }: Props) {
  const [ingresoMuestra, setIngresoMuestra] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await crearSET(formData)
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="cotizacionId" value={cotizacionId} />

      {/* Datos del cliente y contacto (solo lectura) */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm">Datos del cliente</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Cotización</p>
            <p className="font-medium">{numCotizacion}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Cliente</p>
            <p className="font-medium">{cliente.razonSocial}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">RUC</p>
            <p className="font-mono">{cliente.ruc}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Dirección</p>
            <p>{cliente.direccion}</p>
          </div>
          {contacto.contactoNombre && (
            <div>
              <p className="text-slate-500 text-xs">Contacto</p>
              <p>{contacto.contactoNombre}</p>
            </div>
          )}
          {contacto.contactoEmail && (
            <div>
              <p className="text-slate-500 text-xs">Email</p>
              <p>{contacto.contactoEmail}</p>
            </div>
          )}
          {contacto.contactoTelefono && (
            <div>
              <p className="text-slate-500 text-xs">Teléfono</p>
              <p>{contacto.contactoTelefono}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nombre del paciente */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm">Nombre del paciente <span className="font-normal text-slate-400">(opcional)</span></h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Nombres y apellidos</Label>
            <Input name="nombrePaciente" placeholder="Solo si aplica" />
          </div>
        </div>
      </div>

      {/* Datos de la muestra */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm">Datos de la muestra</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Nombre comercial *</Label>
            <Input name="nombreComercial" required />
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
          </div>
          {ingresoMuestra === 'Otro' && (
            <div className="space-y-2">
              <Label>Especificar ingreso</Label>
              <Input name="ingresoMuestraOtro" placeholder="Indicar método de ingreso" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Número de muestras</Label>
            <Input name="numeroMuestras" type="number" min="1" placeholder="1" />
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
            <Input name="condicionesAmbientales" placeholder="p. ej. Temperatura ambiente" />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Procedencia / Características / Descripción</Label>
            <Input name="procedenciaDescripcion" />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Otra indicación</Label>
            <Input name="otraIndicacion" />
          </div>
        </div>
      </div>

      {/* Descripción del envase */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm">Descripción del envase</h2>
        <div className="grid grid-cols-2 gap-4">
          <SelectField name="tipoEnvase" label="Tipo de envase" options={TIPO_ENVASE_OPTIONS} />
          <SelectField name="materialEnvase" label="Material" options={MATERIAL_OPTIONS} />
          <SelectField name="etiquetaEnvase" label="Etiqueta" options={ETIQUETA_OPTIONS} />
          <SelectField name="seguridadEnvase" label="Seguridad" options={SEGURIDAD_OPTIONS} />
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

      <Button type="submit" style={{ backgroundColor: '#1F4E79' }} disabled={loading}>
        {loading ? 'Creando...' : 'Crear SET'}
      </Button>
    </form>
  )
}
