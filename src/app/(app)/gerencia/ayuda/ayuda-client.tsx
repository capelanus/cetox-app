'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import {
  BookOpen, Target, ClipboardList, Gauge, ShieldAlert, Rocket, Wrench, LayoutDashboard,
  Wallet, TrendingUp, Building2, PieChart, FileText, ArrowRight, Info,
} from 'lucide-react'

// ── Índice ───────────────────────────────────────────────────────────────────
const TOC = [
  {
    grupo: 'Planeamiento Estratégico',
    items: [
      { id: 'pei', label: 'Plan Estratégico (PEI)' },
      { id: 'poa', label: 'Plan Operativo (POA)' },
      { id: 'kpis', label: 'Indicadores (KPIs)' },
      { id: 'riesgos', label: 'Riesgos' },
      { id: 'proyectos', label: 'Proyectos' },
      { id: 'mejoras', label: 'Acciones de Mejora' },
      { id: 'dashboard', label: 'Dashboard Gerencial' },
    ],
  },
  {
    grupo: 'Contabilidad y Finanzas',
    items: [
      { id: 'presupuesto', label: 'Presupuesto' },
      { id: 'flujo', label: 'Flujo de Caja' },
      { id: 'centros', label: 'Centros de Costo' },
      { id: 'rentabilidad', label: 'Rentabilidad' },
      { id: 'documentos', label: 'Documentos' },
      { id: 'panel', label: 'Panel Financiero' },
    ],
  },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Helpers de presentación ──────────────────────────────────────────────────
function Section({ id, icon, title, route, children }: {
  id: string; icon: ReactNode; title: string; route?: string; children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 mb-10">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">{icon}</span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {route && (
          <Link href={route} className="ml-auto text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
            Ir a la sección <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="pl-10 space-y-3 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  )
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal ml-4 space-y-1.5 marker:text-slate-400 marker:font-semibold">{children}</ol>
}
function Bullets({ children }: { children: ReactNode }) {
  return <ul className="list-disc ml-4 space-y-1 marker:text-slate-300">{children}</ul>
}
function Formula({ children }: { children: ReactNode }) {
  return (
    <pre className="bg-slate-900 text-slate-100 rounded-lg px-4 py-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
      {children}
    </pre>
  )
}
function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}
function Estados({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />{label}
        </span>
      ))}
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────
export function AyudaClient() {
  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">
          <BookOpen className="w-4 h-4" /> Guía de uso
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Gerencia — Guía de los módulos</h1>
        <p className="text-sm text-slate-500">Cómo funciona cada sección de Planeamiento Estratégico y de Contabilidad y Finanzas.</p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            {TOC.map(g => (
              <div key={g.grupo}>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{g.grupo}</p>
                <div className="space-y-0.5">
                  {g.items.map(it => (
                    <button key={it.id} onClick={() => scrollTo(it.id)}
                      className="block w-full text-left text-xs text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/60 rounded px-2 py-1 transition-colors">
                      {it.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Contenido */}
        <div>
          {/* Intro planeamiento */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-2">Planeamiento Estratégico — visión general</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Digitaliza el ciclo de planeamiento y control gerencial (marco CEPLAN). La lógica de arriba hacia abajo es:
            </p>
            <Formula>{`PEI  (Plan Estratégico Institucional, plurianual)
 └─ OEI  Objetivo Estratégico       → se mide con KPIs
     └─ AEI  Acción Estratégica
         └─ Actividad Operativa (POA, anual, por departamento) → seguimiento mensual

En paralelo, colgando de los objetivos:
   Indicadores (KPIs) · Riesgos · Proyectos · Acciones de Mejora
Todo se consolida en el → Dashboard Gerencial`}</Formula>
            <p className="text-xs text-slate-500 mt-3">
              <b>Acceso:</b> Gerente General, Gerente Técnico, Dirección de Calidad, Dirección de Administración y Super Admin.
            </p>
          </div>

          {/* ── PEI ── */}
          <Section id="pei" icon={<Target className="w-4 h-4" />} title="Plan Estratégico (PEI)" route="/gerencia/pei">
            <p>Punto de partida: define el plan plurianual y su árbol de objetivos.</p>
            <Steps>
              <li>Si no hay plan, se crea el <b>PEI</b>: nombre (ej. "PEI 2026–2030"), años, <b>visión</b> y <b>misión</b>.</li>
              <li>Se agregan los <b>Objetivos Estratégicos (OEI)</b>: código (OEI.01), nombre, descripción, departamento (o "Institucional") y responsable.</li>
              <li>Dentro de cada OEI se agregan las <b>Acciones Estratégicas (AEI)</b>: código (AEI.01.01), nombre, departamento y responsable.</li>
            </Steps>
            <Note>Los OEI/AEI son la columna vertebral: el POA, los KPIs, los riesgos y los proyectos se enlazan a ellos. Por eso el PEI se crea primero.</Note>
          </Section>

          {/* ── POA ── */}
          <Section id="poa" icon={<ClipboardList className="w-4 h-4" />} title="Plan Operativo (POA)" route="/gerencia/poa">
            <p>Baja la estrategia a <b>actividades operativas anuales por departamento</b>, con seguimiento mensual.</p>
            <Steps>
              <li>Selector de <b>año</b>. Cada actividad se enlaza a una <b>AEI</b> del PEI.</li>
              <li>Se define: nombre, departamento, responsable, <b>unidad de medida</b>, <b>meta anual</b> y presupuesto opcional.</li>
              <li>Las actividades se agrupan por departamento. Al desplegar una, aparece la <b>grilla mensual</b> (filas <b>Meta</b> y <b>Real</b>); se guarda al salir de cada celda.</li>
            </Steps>
            <p className="font-semibold text-slate-700">Cálculo del avance:</p>
            <Formula>{`avance (%) = (suma de ejecutado en los 12 meses / meta anual) × 100`}</Formula>
            <p>Color de la barra: <b>Verde</b> ≥ 90 % · <b>Ámbar</b> 70–89 % · <b>Rojo</b> &lt; 70 % · <b>Gris</b> sin meta.</p>
            <Estados items={[['Planificado', '#64748b'], ['En curso', '#3b82f6'], ['Completado', '#10b981'], ['Cancelado', '#94a3b8']]} />
          </Section>

          {/* ── KPIs ── */}
          <Section id="kpis" icon={<Gauge className="w-4 h-4" />} title="Indicadores (KPIs)" route="/gerencia/indicadores">
            <p>Indicadores de gestión con mediciones mensuales y semáforos de cumplimiento.</p>
            <Steps>
              <li>Panel superior con conteo de semáforos (en meta / en riesgo / crítico / sin datos).</li>
              <li>Se define el KPI: nombre, <b>fórmula</b>, OEI asociado, departamento, <b>sentido</b>, <b>frecuencia</b>, unidad, <b>línea base</b>, <b>meta</b> y responsable.</li>
              <li>Cada KPI muestra su último valor y su % de cumplimiento. Al desplegarlo se registran los valores mes a mes.</li>
            </Steps>
            <p className="font-semibold text-slate-700">Cálculo del cumplimiento (según sentido):</p>
            <Formula>{`ASCENDENTE (mayor mejor):   cumplimiento = (valor / meta) × 100
DESCENDENTE (menor mejor):  cumplimiento = (meta / valor) × 100`}</Formula>
            <p>Semáforo: <b>Verde</b> ≥ 90 % · <b>Ámbar</b> 70–89 % · <b>Rojo</b> &lt; 70 % · <b>Gris</b> sin datos.</p>
            <Note>Ejemplo: KPI de "días de demora", meta 5, sentido <b>Descendente</b>. Si el real es 4 días → 5/4 = 125 % (verde, tardó menos que la meta).</Note>
          </Section>

          {/* ── Riesgos ── */}
          <Section id="riesgos" icon={<ShieldAlert className="w-4 h-4" />} title="Riesgos" route="/gerencia/riesgos">
            <p>Gestión de riesgos con <b>matriz de calor</b> probabilidad × impacto.</p>
            <Steps>
              <li>La <b>matriz 5×5</b> muestra cuántos riesgos activos hay en cada celda; al hacer clic se filtra la lista.</li>
              <li>Cada riesgo: código, descripción, causa, <b>categoría</b>, <b>probabilidad (1–5)</b>, <b>impacto (1–5)</b>, departamento, responsable, <b>plan de mitigación</b> y estado.</li>
            </Steps>
            <p className="font-semibold text-slate-700">Cálculo del nivel:</p>
            <Formula>{`puntaje = probabilidad × impacto   (1–25)
  ≥ 15 → Crítico   ·   ≥ 9 → Alto   ·   ≥ 4 → Medio   ·   < 4 → Bajo`}</Formula>
            <Estados items={[['Identificado', '#64748b'], ['En tratamiento', '#f59e0b'], ['Mitigado', '#10b981'], ['Materializado', '#ef4444']]} />
            <Note>Los riesgos <b>Mitigados</b> no cuentan como activos: no aparecen en la matriz ni en los conteos de críticos.</Note>
          </Section>

          {/* ── Proyectos ── */}
          <Section id="proyectos" icon={<Rocket className="w-4 h-4" />} title="Proyectos" route="/gerencia/proyectos">
            <p>Portafolio de proyectos estratégicos con hitos.</p>
            <Steps>
              <li>Cada proyecto: nombre, descripción, OEI asociado, departamento, <b>sponsor</b>, <b>gerente</b>, fechas plan, presupuesto, <b>% de avance</b> y estado.</li>
              <li>Al desplegar el proyecto se gestionan sus <b>hitos</b>: se marcan como completados (registra fecha real), se agregan y se eliminan.</li>
            </Steps>
            <Estados items={[['Planificado', '#64748b'], ['En curso', '#3b82f6'], ['En pausa', '#f59e0b'], ['Completado', '#10b981'], ['Cancelado', '#94a3b8']]} />
            <Note>Un proyecto se marca como <b>atrasado</b> (alerta en el dashboard) si su fecha de fin planificada ya pasó y no está Completado ni Cancelado.</Note>
          </Section>

          {/* ── Mejoras ── */}
          <Section id="mejoras" icon={<Wrench className="w-4 h-4" />} title="Acciones de Mejora (CAPA)" route="/gerencia/mejoras">
            <p>Acciones correctivas/preventivas que cierran el ciclo de mejora continua.</p>
            <Steps>
              <li>Conteo de abiertas y vencidas, con filtros por estado.</li>
              <li>Cada acción: código, <b>origen</b> (Auditoría, Riesgo, Sugerencia de cliente, No conformidad, Revisión por dirección, Otro), descripción, <b>causa raíz</b>, <b>acción correctiva</b>, responsable y <b>fecha de compromiso</b>.</li>
              <li>En edición: fecha de cierre, estado y casilla <b>"Eficacia verificada"</b>.</li>
            </Steps>
            <Bullets>
              <li>Enlazable a <b>auditorías</b> existentes del sistema.</li>
              <li>El origen "Sugerencia de cliente" traza mejoras desde el formulario público de sugerencias.</li>
              <li>Si la fecha de compromiso pasó y no está cerrada, se marca en <b>rojo como vencida</b>.</li>
            </Bullets>
          </Section>

          {/* ── Dashboard ── */}
          <Section id="dashboard" icon={<LayoutDashboard className="w-4 h-4" />} title="Dashboard Gerencial" route="/gerencia/dashboard">
            <p>Consolida todo el módulo en tiempo real.</p>
            <Bullets>
              <li><b>4 indicadores grandes</b>: Avance POA global, KPIs en meta, Riesgos activos/críticos, Mejoras abiertas/vencidas.</li>
              <li><b>Alertas prioritarias</b>: KPIs en rojo, riesgos críticos, mejoras vencidas, proyectos atrasados y auditorías próximas (60 días).</li>
              <li>Estado de indicadores, avance POA por departamento, mapa de riesgos, portafolio de proyectos y auditorías próximas.</li>
            </Bullets>
            <p className="font-semibold text-slate-700">Cálculos:</p>
            <Formula>{`Avance POA global      = promedio de los avances por departamento
Avance por departamento = promedio de los avances de sus actividades (meta > 0)
KPIs                    = última medición del año → semáforo
Riesgos                 = solo activos (no mitigados)`}</Formula>
          </Section>

          {/* ── Intro contabilidad ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8 mt-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-2">Contabilidad y Finanzas — visión general</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Se arma el <b>presupuesto</b> (partidas de ingresos y egresos con montos mensuales planificados y ejecutados);
              de ahí se derivan automáticamente el <b>flujo de caja</b> y el análisis por <b>centro de costo</b>.
              La <b>rentabilidad</b> se registra por operación (cliente × servicio) y los <b>documentos</b> de respaldo se archivan.
            </p>
          </div>

          {/* ── Presupuesto ── */}
          <Section id="presupuesto" icon={<Wallet className="w-4 h-4" />} title="Presupuesto" route="/gerencia/contabilidad/presupuesto">
            <p>Núcleo del submódulo. Se registran <b>partidas</b> de tipo <b>Ingreso</b> o <b>Egreso</b>.</p>
            <Steps>
              <li>Selector de año. Cada partida: tipo, <b>categoría</b> (predefinidas), <b>concepto</b> y centro de costo opcional.</li>
              <li>Se agrupan en Ingresos y Egresos, con ejecutado vs. planificado y % de ejecución.</li>
              <li>Al desplegar, la <b>grilla mensual</b> con filas <b>Plan</b> y <b>Real</b> (montos en soles); se guarda al salir de la celda.</li>
            </Steps>
            <p className="font-semibold text-slate-700">% de ejecución = (ejecutado / planificado) × 100.</p>
            <Bullets>
              <li><b>Egreso</b>: &gt; 100 % rojo (sobregasto) · 85–100 % ámbar · &lt; 85 % verde.</li>
              <li><b>Ingreso</b>: ≥ 100 % verde (superó meta) · 80–99 % ámbar · &lt; 80 % rojo.</li>
            </Bullets>
          </Section>

          {/* ── Flujo ── */}
          <Section id="flujo" icon={<TrendingUp className="w-4 h-4" />} title="Flujo de Caja proyectado" route="/gerencia/contabilidad/flujo-caja">
            <p>Vista <b>derivada automáticamente del presupuesto</b> (no se captura aparte).</p>
            <Bullets>
              <li>Por mes: ingresos, egresos, <b>flujo neto proyectado</b> (ingresos − egresos), flujo neto real y <b>saldo acumulado</b>.</li>
              <li>Gráfico de barras del flujo neto (verde positivo / rojo negativo) y tarjetas resumen.</li>
            </Bullets>
          </Section>

          {/* ── Centros ── */}
          <Section id="centros" icon={<Building2 className="w-4 h-4" />} title="Centros de Costo" route="/gerencia/contabilidad/centros-costo">
            <p>Analiza el presupuesto por unidad organizativa o proyecto.</p>
            <Bullets>
              <li>Cada centro: código, nombre, departamento y responsable.</li>
              <li>Se le asignan partidas desde el Presupuesto; la tarjeta muestra <b>presupuesto vs. ejecutado</b> del año.</li>
            </Bullets>
          </Section>

          {/* ── Rentabilidad ── */}
          <Section id="rentabilidad" icon={<PieChart className="w-4 h-4" />} title="Rentabilidad" route="/gerencia/contabilidad/rentabilidad">
            <p>Mide el <b>margen por cliente y por servicio</b>.</p>
            <Steps>
              <li>Cada registro: mes, <b>cliente</b> (autocompleta con clientes reales), <b>servicio</b> (autocompleta con ensayos), <b>ingreso</b>, <b>costo directo</b> y <b>costo indirecto</b>.</li>
              <li>Tres vistas: Por cliente, Por servicio (agregados por margen) y Detalle (editable).</li>
            </Steps>
            <Formula>{`margen   = ingreso − costo directo − costo indirecto
margen % = (margen / ingreso) × 100`}</Formula>
            <p>Color del margen: ≥ 25 % verde · 10–24 % ámbar · 0–9 % naranja · negativo rojo.</p>
            <Note>La rentabilidad es de <b>captura manual</b> (los costos por cliente/servicio no se rastrean automáticamente en el ERP).</Note>
          </Section>

          {/* ── Documentos ── */}
          <Section id="documentos" icon={<FileText className="w-4 h-4" />} title="Documentos" route="/gerencia/contabilidad/documentos">
            <p>Permite que el equipo <b>cargue documentos</b> de respaldo.</p>
            <Bullets>
              <li>Estados de cuenta, comprobantes, reportes, conciliaciones, declaraciones SUNAT, etc.</li>
              <li>Se sube con nombre, <b>categoría</b>, año y centro de costo opcional; se guarda quién lo subió y la fecha.</li>
              <li>Desde la lista se descarga o elimina. Almacenamiento en Vercel Blob.</li>
            </Bullets>
          </Section>

          {/* ── Panel ── */}
          <Section id="panel" icon={<LayoutDashboard className="w-4 h-4" />} title="Panel Financiero" route="/gerencia/contabilidad">
            <p>Consolida el submódulo:</p>
            <Bullets>
              <li>KPIs: ingresos y egresos ejecutados, resultado real vs. proyectado, n° de centros de costo.</li>
              <li>Mini gráfico de flujo de caja, <b>top de rentabilidad por cliente y servicio</b>, documentos recientes y accesos rápidos.</li>
            </Bullets>
          </Section>
        </div>
      </div>
    </div>
  )
}
