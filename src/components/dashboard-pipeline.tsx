'use client'

import { useEffect, useState } from 'react'
import { FileText, ClipboardList, TestTube, FileCheck, ArrowRight } from 'lucide-react'

// ─── Stages ──────────────────────────────────────────────────────────────────

const COT_STAGES = [
  { estado: 'BORRADOR',    label: 'Borrador',    color: '#94a3b8' },
  { estado: 'EN_REVISION', label: 'En revisión', color: '#4AC3B2' },
  { estado: 'ENVIADA',     label: 'Enviada',     color: '#13602C' },
  { estado: 'ACEPTADA',    label: 'Aceptada',    color: '#0d4a20' },
  { estado: 'RECHAZADA',   label: 'Rechazada',   color: '#ef4444' },
]

const SET_STAGES = [
  { estado: 'EMITIDA',         label: 'Emitida',      color: '#fbbf24' },
  { estado: 'EN_EJECUCION',    label: 'En ejecución', color: '#d97706' },
  { estado: 'INFORME_EMITIDO', label: 'Completado',   color: '#13602C' },
]

const ODA_STAGES = [
  { estado: 'EMITIDA',      label: 'Emitida',      color: '#fdba74' },
  { estado: 'RECIBIDA',     label: 'Recibida',     color: '#fb923c' },
  { estado: 'EN_EJECUCION', label: 'En ejecución', color: '#ea580c' },
  { estado: 'COMPLETADA',   label: 'Completada',   color: '#13602C' },
]

const INF_STAGES = [
  { estado: 'BORRADOR',            label: 'Borrador',       color: '#94a3b8' },
  { estado: 'EN_REVISION_CALIDAD', label: 'Rev. Calidad',   color: '#fbbf24' },
  { estado: 'EN_FIRMA_GERENCIA',   label: 'Firma Gerencia', color: '#4AC3B2' },
  { estado: 'INFORME_EMITIDO',     label: 'Emitido',        color: '#13602C' },
]

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StageCount = { estado: string; count: number }

export interface PipelineData {
  cotizaciones: StageCount[]
  sets:         StageCount[]
  odas:         StageCount[]
  informes:     StageCount[]
}

interface StageConfig {
  estado: string
  label:  string
  color:  string
}

// ─── Pipeline row ─────────────────────────────────────────────────────────────

interface PipelineRowProps {
  title:   string
  icon:    React.ReactNode
  stages:  StageConfig[]
  data:    StageCount[]
  delay:   number
  mounted: boolean
}

function PipelineRow({ title, icon, stages, data, delay, mounted }: PipelineRowProps) {
  const total    = data.reduce((s, d) => s + d.count, 0)
  const getCount = (estado: string) => data.find(d => d.estado === estado)?.count ?? 0

  return (
    <div className="cetox-card p-5">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
          style={{ backgroundColor: '#DCF0E4' }}
        >
          <span style={{ color: '#13602C' }}>{icon}</span>
        </div>
        <span
          className="font-semibold text-sm uppercase tracking-wider"
          style={{ color: '#13602C', fontFamily: 'var(--font-oswald)' }}
        >
          {title}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <span
            className="text-2xl font-bold leading-none"
            style={{ color: '#13602C', fontFamily: 'var(--font-oswald)' }}
          >
            {total}
          </span>
          <span className="text-xs mt-1" style={{ color: '#808080' }}>total</span>
        </div>
      </div>

      {/* Separador */}
      <div className="h-px mb-4" style={{ backgroundColor: '#EAF4F4' }} />

      {/* Etapas */}
      <div className="flex items-stretch gap-1 mb-3">
        {stages.map((stage, i) => {
          const count  = getCount(stage.estado)
          const active = count > 0

          return (
            <div key={stage.estado} className="flex items-center gap-1 flex-1 min-w-0">
              {i > 0 && (
                <ArrowRight className="h-3 w-3 flex-shrink-0" style={{ color: '#CCE3DE' }} />
              )}
              <div
                className="flex-1 min-w-0 rounded-lg border p-2.5 text-center transition-all duration-500"
                style={{
                  borderColor:     active ? stage.color : '#E2E8F0',
                  backgroundColor: active ? `${stage.color}14` : '#FAFAFA',
                  opacity:         mounted ? 1 : 0,
                  transform:       mounted ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: `${delay + i * 80}ms`,
                }}
              >
                <div
                  className="text-xl font-bold leading-none mb-1"
                  style={{
                    color:      active ? stage.color : '#CBD5E1',
                    fontFamily: 'var(--font-oswald)',
                  }}
                >
                  {count}
                </div>
                <div
                  className="text-[10px] leading-tight font-medium truncate"
                  style={{ color: active ? '#808080' : '#CBD5E1', fontFamily: 'var(--font-montserrat)' }}
                >
                  {stage.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Barra apilada animada */}
      {total > 0 ? (
        <div className="h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: '#EAF4F4' }}>
          {stages.map((stage) => {
            const count = getCount(stage.estado)
            const pct   = (count / total) * 100
            return (
              <div
                key={stage.estado}
                style={{
                  width:      mounted ? `${pct}%` : '0%',
                  backgroundColor: stage.color,
                  transition: `width 0.9s cubic-bezier(0.4, 0, 0.2, 1) ${delay + 500}ms`,
                  minWidth:   count > 0 && mounted ? '3px' : '0',
                }}
              />
            )
          })}
        </div>
      ) : (
        <div className="h-1.5 rounded-full" style={{ backgroundColor: '#EAF4F4' }}>
          <div
            style={{
              width:      mounted ? '100%' : '0%',
              height:     '100%',
              background: 'linear-gradient(90deg, #CCE3DE, #EAF4F4)',
              borderRadius: '999px',
              transition: `width 0.9s ease-out ${delay + 500}ms`,
            }}
          />
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
        {stages.map((stage) => {
          const count = getCount(stage.estado)
          if (count === 0) return null
          return (
            <div key={stage.estado} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
              <span className="text-[10px]" style={{ color: '#808080', fontFamily: 'var(--font-montserrat)' }}>
                {stage.label} ({count})
              </span>
            </div>
          )
        })}
        {total === 0 && (
          <span className="text-[10px] italic" style={{ color: '#94a3b8', fontFamily: 'var(--font-montserrat)' }}>
            Sin registros activos
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DashboardPipeline({ cotizaciones, sets, odas, informes }: PipelineData) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PipelineRow
        title="Cotizaciones"
        icon={<FileText className="h-3.5 w-3.5" />}
        stages={COT_STAGES}
        data={cotizaciones}
        delay={0}
        mounted={mounted}
      />
      <PipelineRow
        title="SETs"
        icon={<ClipboardList className="h-3.5 w-3.5" />}
        stages={SET_STAGES}
        data={sets}
        delay={120}
        mounted={mounted}
      />
      <PipelineRow
        title="ODAs"
        icon={<TestTube className="h-3.5 w-3.5" />}
        stages={ODA_STAGES}
        data={odas}
        delay={240}
        mounted={mounted}
      />
      <PipelineRow
        title="Informes"
        icon={<FileCheck className="h-3.5 w-3.5" />}
        stages={INF_STAGES}
        data={informes}
        delay={360}
        mounted={mounted}
      />
    </div>
  )
}
