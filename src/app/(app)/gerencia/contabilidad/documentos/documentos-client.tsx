'use client'

import { useState } from 'react'
import { FileText, UploadCloud, Trash2, Download, Loader2, User } from 'lucide-react'
import { registrarDocumento, eliminarDocumento } from '@/app/actions/contabilidad'
import { CATEGORIAS_DOCUMENTO } from '@/lib/contabilidad'
import { Modal, Txt, Sel, Field, useAction, nombreUsuario, subirArchivo, type Usuario } from '@/components/planeamiento/kit'

interface Documento {
  id: string; nombre: string; categoria: string | null; url: string; tamano: number | null
  centroCostoId: string | null; anio: number | null; periodo: number | null; subidoPorId: string | null; createdAt: string
}
interface CentroRef { id: string; nombre: string }

const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtSize = (b: number | null) => b === null ? '' : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

export function DocumentosClient({ documentos, centros, usuarios }: {
  documentos: Documento[]; centros: CentroRef[]; usuarios: Usuario[]
}) {
  const [pending, run] = useAction()
  const [open, setOpen] = useState(false)

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
            <FileText className="w-4 h-4" /> Contabilidad y Finanzas
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-sm text-slate-500">Estados de cuenta, comprobantes, reportes y conciliaciones.</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: '#13602C' }}>
          <UploadCloud className="w-4 h-4" /> Subir documento
        </button>
      </div>

      {documentos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400">
          Sin documentos cargados aún.
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{d.nombre}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {d.categoria && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">{d.categoria}</span>}
                  <span className="text-[11px] text-slate-400">{fmtDate(d.createdAt)}</span>
                  {d.tamano && <span className="text-[11px] text-slate-400">{fmtSize(d.tamano)}</span>}
                  {d.anio && <span className="text-[11px] text-slate-400">{d.anio}{d.periodo ? `·M${d.periodo}` : ''}</span>}
                  {nombreUsuario(usuarios, d.subidoPorId) && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><User className="w-3 h-3" />{nombreUsuario(usuarios, d.subidoPorId)}</span>
                  )}
                </div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"><Download className="w-4 h-4" /></a>
              <button onClick={() => run(() => eliminarDocumento(d.id))}
                className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {open && <SubirModal centros={centros} onClose={() => setOpen(false)} />}
    </div>
  )
}

function SubirModal({ centros, onClose }: { centros: CentroRef[]; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [centroCostoId, setCentroCostoId] = useState('')
  const [anio, setAnio] = useState(String(new Date().getFullYear()))
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!file) { setError('Selecciona un archivo'); return }
    setSubiendo(true); setError('')
    try {
      const url = await subirArchivo(file)
      await registrarDocumento({
        nombre: nombre || file.name, url, categoria: categoria || undefined, tamano: file.size,
        centroCostoId: centroCostoId || undefined, anio: anio ? parseInt(anio) : undefined,
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir')
      setSubiendo(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Subir documento financiero" pending={subiendo} submitLabel="Subir"
      onSubmit={submit}>
      <Field label="Archivo">
        <input type="file" onChange={e => { const fl = e.target.files?.[0] ?? null; setFile(fl); if (fl && !nombre) setNombre(fl.name) }}
          className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:text-xs file:font-semibold border border-slate-300 rounded-lg p-2" />
      </Field>
      <Txt label="Nombre / descripción" value={nombre} onChange={setNombre} placeholder="Estado de cuenta BCP enero" />
      <div className="grid grid-cols-2 gap-3">
        <Sel label="Categoría" value={categoria} onChange={setCategoria} placeholder="—" options={CATEGORIAS_DOCUMENTO.map(c => ({ value: c, label: c }))} />
        <Txt label="Año" value={anio} onChange={setAnio} />
      </div>
      <Sel label="Centro de costo" value={centroCostoId} onChange={setCentroCostoId} placeholder="— Ninguno —" options={centros.map(c => ({ value: c.id, label: c.nombre }))} />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><Loader2 className="w-3 h-3" style={{ display: 'none' }} />{error}</p>}
    </Modal>
  )
}
