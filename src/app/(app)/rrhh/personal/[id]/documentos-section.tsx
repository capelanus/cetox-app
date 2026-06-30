'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Upload, FileText, FileImage, File as FileIcon, Trash2, Download, Loader2, Paperclip, Eye, EyeOff } from 'lucide-react'
import { subirDocumentoEmpleado, eliminarDocumentoEmpleado, actualizarVisibilidadDoc } from '@/app/actions/rrhh'

interface Documento {
  id:             string
  nombre:         string
  tipo:           string | null
  archivoUrl:     string
  archivoTipo:    string | null
  tamanio:        number | null
  visibleCalidad: boolean
  createdAt:      string
}

interface Props {
  empleadoId: string
  documentos: Documento[]
}

const TIPOS_DOC = [
  'Competencia técnica',
  'Ficha de ingreso',
  'Contrato de trabajo',
  'Vacaciones firmadas',
  'Boleta de pago',
  'Constancia',
  'Identificación',
  'Certificado',
  'Otro',
]

const TIPOS_SIEMPRE_VISIBLES = ['Competencia técnica', 'Ficha de ingreso']

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function iconForType(tipo: string | null) {
  if (tipo?.startsWith('image/')) return FileImage
  if (tipo === 'application/pdf') return FileText
  return FileIcon
}

export function DocumentosSection({ empleadoId, documentos }: Props) {
  const [isPending, startTransition] = useTransition()
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tipoSeleccionado, setTipoSeleccionado] = useState('')

  // Derive visibleCalidad default from selected tipo
  const defaultVisible = TIPOS_SIEMPRE_VISIBLES.includes(tipoSeleccionado)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    // Set visibleCalidad based on checkbox or forced-true for special types
    startTransition(async () => {
      try {
        await subirDocumentoEmpleado(empleadoId, fd)
        form.reset()
        setTipoSeleccionado('')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al subir'
        setError(msg)
      }
    })
  }

  function handleEliminar(documentoId: string, nombre: string) {
    if (!confirm(`¿Eliminar el documento "${nombre}"?`)) return
    setEliminandoId(documentoId)
    startTransition(async () => {
      try {
        await eliminarDocumentoEmpleado(documentoId)
      } catch {
        alert('Error al eliminar')
      } finally {
        setEliminandoId(null)
      }
    })
  }

  function handleToggleVisibilidad(doc: Documento) {
    if (TIPOS_SIEMPRE_VISIBLES.includes(doc.tipo ?? '')) return
    setToggling(doc.id)
    startTransition(async () => {
      try {
        await actualizarVisibilidadDoc(doc.id, !doc.visibleCalidad)
      } catch {
        alert('Error al actualizar visibilidad')
      } finally {
        setToggling(null)
      }
    })
  }

  return (
    <div className="cetox-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase text-slate-400"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Documentos
        </p>
        <span className="text-[10px] text-slate-400">
          {documentos.length} {documentos.length === 1 ? 'archivo' : 'archivos'}
        </span>
      </div>

      {/* ── Formulario de subida ── */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-dashed border-slate-200 p-4 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Nombre *</label>
            <input
              name="nombre"
              required
              maxLength={140}
              placeholder="Ej. Contrato 2026"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-slate-400 bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tipo</label>
            <select
              name="tipo"
              value={tipoSeleccionado}
              onChange={e => setTipoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-slate-400 bg-white"
            >
              <option value="">— Sin tipo —</option>
              {TIPOS_DOC.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Archivo * (máx. 25 MB)</label>
          <input
            name="archivo"
            type="file"
            required
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            className="w-full text-xs text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
        </div>

        {/* Visibilidad para calidad */}
        <div className="flex items-center gap-2">
          {defaultVisible ? (
            <>
              <input type="hidden" name="visibleCalidad" value="true" />
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                <Eye className="w-3.5 h-3.5" />
                Visible para Calidad (siempre, por tipo de documento)
              </span>
            </>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
              <input
                type="checkbox"
                name="visibleCalidad"
                value="true"
                className="w-3.5 h-3.5 accent-[#13602C]"
              />
              Visible para el área de Calidad
            </label>
          )}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #13602C 0%, #2d6fa8 100%)', fontFamily: 'var(--font-montserrat)' }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isPending ? 'Subiendo…' : 'Subir documento'}
          </button>
        </div>
      </form>

      {/* ── Lista de documentos ── */}
      {documentos.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-400 py-2">
          <Paperclip className="w-4 h-4" />
          <p className="text-xs">No hay documentos subidos aún</p>
        </div>
      ) : (
        <ul className="divide-y">
          {documentos.map((doc) => {
            const Icon = iconForType(doc.archivoTipo)
            const eliminando = eliminandoId === doc.id
            const siempreVisible = TIPOS_SIEMPRE_VISIBLES.includes(doc.tipo ?? '')
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 py-2.5 group"
                style={{ opacity: eliminando ? 0.4 : 1 }}
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: 'rgba(19,96,44,0.08)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#13602C' }} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 truncate">{doc.nombre}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                    {doc.tipo && (
                      <span
                        className="font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(74,195,178,0.12)', color: '#13602C' }}
                      >
                        {doc.tipo}
                      </span>
                    )}
                    <span>{format(new Date(doc.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}</span>
                    {doc.tamanio && <span>· {formatBytes(doc.tamanio)}</span>}
                    {/* Visibilidad badge */}
                    {doc.visibleCalidad ? (
                      <span className="flex items-center gap-0.5 text-emerald-600">
                        <Eye className="w-3 h-3" />
                        {siempreVisible ? 'Calidad (siempre)' : 'Calidad'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-slate-400">
                        <EyeOff className="w-3 h-3" />
                        Solo RRHH
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Toggle visibilidad (solo para tipos no forzados) */}
                  {!siempreVisible && (
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilidad(doc)}
                      disabled={toggling === doc.id}
                      className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                        doc.visibleCalidad
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={doc.visibleCalidad ? 'Ocultar de Calidad' : 'Compartir con Calidad'}
                    >
                      {toggling === doc.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : doc.visibleCalidad ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />
                      }
                    </button>
                  )}
                  <a
                    href={doc.archivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Descargar / abrir"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleEliminar(doc.id, doc.nombre)}
                    disabled={eliminando}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
                    title="Eliminar"
                  >
                    {eliminando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
