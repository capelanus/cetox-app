'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Props {
  selected:   string[]           // ISO "YYYY-MM-DD"
  onChange:   (dates: string[]) => void
  /** Permitir seleccionar fechas anteriores a hoy. Default false. */
  allowPast?: boolean
}

const DIAS  = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

export function CalendarioMultiSelect({ selected, onChange, allowPast = false }: Props) {
  const today   = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const selectedSet = useMemo(() => new Set(selected), [selected])

  function toggleDate(iso: string) {
    if (selectedSet.has(iso)) {
      onChange(selected.filter(d => d !== iso))
    } else {
      onChange([...selected, iso])
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  function prevYear() { setYear(y => y - 1) }
  function nextYear() { setYear(y => y + 1) }

  // Build grid
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  // Convert to Mon-first (0=Mon … 6=Sun)
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null)

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())

  // Sort and format selected for display
  const sortedSelected = [...selected].sort()

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={prevYear}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: '#64748b' }}
            title="Año anterior"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: '#64748b' }}
            title="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <span className="font-semibold text-sm" style={{ color: '#1e293b' }}>
          {MESES[month]} {year}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: '#64748b' }}
            title="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextYear}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: '#64748b' }}
            title="Año siguiente"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5">
        {DIAS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold py-1 tracking-wider"
            style={{ color: '#94a3b8' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const iso      = toISO(year, month, day)
          const isSel    = selectedSet.has(iso)
          const isToday  = iso === todayISO
          const isPast   = iso < todayISO
          const disabled = !allowPast && isPast

          return (
            <button
              key={idx}
              type="button"
              onClick={() => !disabled && toggleDate(iso)}
              disabled={disabled}
              className="relative flex items-center justify-center rounded-lg text-sm font-medium transition-all"
              style={{
                height: 36,
                backgroundColor: isSel ? '#13602C' : isToday ? 'rgba(74,195,178,0.12)' : 'transparent',
                color: isSel ? 'white' : disabled ? '#cbd5e1' : isPast ? '#94a3b8' : isToday ? '#13602C' : '#334155',
                fontWeight: isSel || isToday ? 700 : 400,
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: isToday && !isSel ? '1.5px solid #4AC3B2' : '1.5px solid transparent',
              }}
              title={disabled ? 'Fecha pasada' : iso}
            >
              {day}
              {isSel && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-300" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected dates summary */}
      {sortedSelected.length > 0 && (
        <div
          className="rounded-xl p-3 mt-1"
          style={{ backgroundColor: 'rgba(19,96,44,0.06)', border: '1px solid rgba(19,96,44,0.15)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#13602C' }}>
            {sortedSelected.length} día{sortedSelected.length !== 1 ? 's' : ''} seleccionado{sortedSelected.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-1">
            {sortedSelected.map(iso => {
              const { year: y, month: m, day: d } = parseISO(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onChange(selected.filter(s => s !== iso))}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:opacity-70"
                  style={{ backgroundColor: '#13602C', color: 'white' }}
                  title="Click para quitar"
                >
                  {d} {MESES[m].slice(0,3)} {y}
                  <span className="text-green-300 ml-0.5">×</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
