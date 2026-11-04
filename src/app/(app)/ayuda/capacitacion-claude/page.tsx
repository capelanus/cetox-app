import Link from 'next/link'
import { ArrowLeft, ExternalLink, FileText, Trophy } from 'lucide-react'

export const metadata = { title: 'Capacitación: Claude en CETOX' }

// La clase es un HTML autocontenido servido desde /public (con sesión: el
// proxy exige login para todo). Se muestra en un iframe del mismo origen; la
// ruta /capacitacion-claude/ está en EMBEDDABLE_PREFIXES del proxy. El avance
// de cada persona (encuesta, checklist) queda en el localStorage de su
// navegador.
export default function CapacitacionClaudePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] -mb-4">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <Link href="/ayuda" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Ayuda
        </Link>
        <h1 className="text-lg font-bold text-slate-900 flex-1">Capacitación: Claude en CETOX</h1>
        <Link href="/ayuda/capacitacion-claude/notas"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
          <Trophy className="w-4 h-4" /> Notas
        </Link>
        <a href="/capacitacion-claude/guia.html" target="_blank" rel="noopener"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
          <FileText className="w-4 h-4" /> Guía escrita
        </a>
        <a href="/capacitacion-claude/index.html" target="_blank" rel="noopener"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-white"
          style={{ backgroundColor: '#13602C' }}>
          <ExternalLink className="w-4 h-4" /> Pantalla completa
        </a>
      </div>
      <iframe
        src="/capacitacion-claude/index.html"
        title="Capacitación: Claude en CETOX"
        className="flex-1 w-full rounded-xl border border-slate-200 bg-white"
      />
    </div>
  )
}
