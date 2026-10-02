import { FileText, FileSpreadsheet, FileImage, File, Mail } from 'lucide-react'

// .eml y .msg son correos guardados (Outlook, Gmail): los clientes mandan así
// la información y conviene conservar el mensaje original con sus cabeceras.
export const ARCHIVOS_ACEPTADOS = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.gif,.eml,.msg'

export function extensionDe(nombre: string) {
  return nombre.split('.').pop()?.toLowerCase() ?? ''
}

export function iconoDe(nombre: string) {
  const ext = extensionDe(nombre)
  if (['eml', 'msg'].includes(ext)) return { Icono: Mail, color: 'text-amber-600' }
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icono: FileSpreadsheet, color: 'text-green-600' }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return { Icono: FileImage, color: 'text-purple-600' }
  if (['doc', 'docx'].includes(ext)) return { Icono: FileText, color: 'text-blue-600' }
  if (ext === 'pdf') return { Icono: FileText, color: 'text-red-600' }
  return { Icono: File, color: 'text-slate-400' }
}

// Word y Excel no se pueden mostrar dentro del navegador; el enlace los descarga.
export function sePuedeVerEnLinea(nombre: string) {
  return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extensionDe(nombre))
}

export function formatTamano(bytes: number | null | undefined) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
