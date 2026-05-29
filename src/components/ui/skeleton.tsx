import { cn } from '@/lib/utils'

// ── Base skeleton ─────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  style?:     React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
      style={style}
    />
  )
}

// ── Skeleton variants ─────────────────────────────────────────────────────────

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 36 }: { size?: number }) {
  return <Skeleton className="rounded-full flex-shrink-0" style={{ width: size, height: size }} />
}

// ── Table skeleton ────────────────────────────────────────────────────────────

interface SkeletonTableRowProps {
  cols:      number
  rows?:     number
}

export function SkeletonTableRows({ cols, rows = 5 }: SkeletonTableRowProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <Skeleton
                className="h-4"
                style={{
                  width: ci === 0 ? '60%' : ci === cols - 1 ? '40%' : `${55 + (ci * 7) % 30}%`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────────

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-100 p-5 bg-white space-y-3', className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={40} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

// ── Stat card skeleton ────────────────────────────────────────────────────────

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-slate-100 p-5 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// ── Page header skeleton ──────────────────────────────────────────────────────

export function SkeletonPageHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  )
}
