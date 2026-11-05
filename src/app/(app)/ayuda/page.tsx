import Link from 'next/link'
import { auth } from '@/lib/auth'
import { LifeBuoy, Sparkles, BookOpen, FileText, ArrowRight, Trophy } from 'lucide-react'

export const metadata = { title: 'Ayuda · CETOX' }

// Centro de ayuda para todo el personal. Cada recurso es una tarjeta; los que
// dependen del rol (p. ej. la guía de Gerencia) solo se muestran a quien
// puede abrirlos.
const ROLES_GUIA_GERENCIA = ['GERENTE_TECNICO', 'GERENTE_GENERAL', 'DIRECTOR_CALIDAD', 'DIRECTOR_ADMINISTRACION', 'SUPER_ADMIN']

export default async function AyudaPage() {
  const session = await auth()
  const rol = session?.user.rol ?? ''

  const recursos = [
    {
      href: '/ayuda/capacitacion-claude',
      icon: Sparkles,
      titulo: 'Capacitación: Claude en CETOX',
      texto: 'Clase interactiva de 12 módulos para Administración, Química y Calidad: cómo pedirle bien a Claude, casos por área, uso responsable de datos y plantillas listas para copiar.',
      etiqueta: 'Clase interactiva',
    },
    {
      href: '/ayuda/capacitacion-claude/notas',
      icon: Trophy,
      titulo: 'Ranking de la capacitación',
      texto: 'Las notas de la evaluación final de todo el personal: tres pruebas del 0 al 20, nota final y podio.',
      etiqueta: 'Ranking',
    },
    {
      href: '/capacitacion-claude/guia.html',
      externo: true,
      icon: FileText,
      titulo: 'Guía de la capacitación (documento)',
      texto: 'El resumen escrito de la clase para consultar después: las cinco piezas de un buen pedido, reglas de CETOX y plantillas. Se puede imprimir.',
      etiqueta: 'Documento',
    },
    ...(ROLES_GUIA_GERENCIA.includes(rol) ? [{
      href: '/gerencia/ayuda',
      icon: BookOpen,
      titulo: 'Guía de los módulos de Gerencia',
      texto: 'Cómo funciona cada sección de Planeamiento Estratégico y de Contabilidad y Finanzas.',
      etiqueta: 'Guía',
    }] : []),
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
          <LifeBuoy className="w-4 h-4" /> Ayuda
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Centro de ayuda</h1>
        <p className="text-sm text-slate-500">Capacitaciones y guías para el personal de CETOX LAB.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {recursos.map(r => {
          const Icon = r.icon
          const contenido = (
            <>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#eaf4f4', color: '#13602C' }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{r.etiqueta}</p>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">{r.titulo}</h2>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{r.texto}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#13602C' }}>
                Abrir <ArrowRight className="w-4 h-4" />
              </span>
            </>
          )
          const cls = 'block bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-emerald-600/40 hover:shadow transition'
          return 'externo' in r && r.externo
            ? <a key={r.href} href={r.href} target="_blank" rel="noopener" className={cls}>{contenido}</a>
            : <Link key={r.href} href={r.href} className={cls}>{contenido}</Link>
        })}
      </div>
    </div>
  )
}
