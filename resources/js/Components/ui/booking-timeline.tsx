import * as React from "react"
import { cn } from "cn"
import { toMinutes } from "./format"

type TimelineTone = "confirmed" | "pending" | "reserved"

type TimelineBlock = {
  id: string | number
  /** "HH:MM" */
  start: string
  end: string
  label: React.ReactNode
  detail?: React.ReactNode
  tone: TimelineTone
  /** Short text for the tooltip and screen readers. */
  title?: string
  /** Makes the block a button. */
  onSelect?: () => void
}

type TimelineRow = {
  id: string | number
  name: React.ReactNode
  description?: React.ReactNode
  blocks: TimelineBlock[]
}

type BookingTimelineProps = {
  rows: TimelineRow[]
  /** First and last hour on the axis, "HH:MM". */
  open?: string
  close?: string
  /** Hour labels every N hours. */
  labelEvery?: number
  legend?: { tone: TimelineTone; label: React.ReactNode }[]
  className?: string
}

const toneClass: Record<TimelineTone, string> = {
  confirmed: "border-success/40 bg-success/10",
  pending: "border-accessible-orange/50 bg-accessible-orange/10",
  reserved: "border-dashed border-input bg-background text-muted-foreground",
}

const LANE = 40

// Blocks that overlap in time go to separate lanes so none hides another.
function lanes(blocks: TimelineBlock[]) {
  const ends: number[] = []
  return [...blocks]
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .map((b) => {
      let lane = ends.findIndex((end) => end <= toMinutes(b.start))
      if (lane === -1) lane = ends.length
      ends[lane] = toMinutes(b.end)
      return { block: b, lane }
    })
}

/** Day view per court: one row per court, hour columns, booking blocks on top. */
function BookingTimeline({ rows, open = "08:00", close = "22:00", labelEvery = 2, legend, className }: BookingTimelineProps) {
  const from = toMinutes(open)
  const span = toMinutes(close) - from
  const hours = span / 60
  const firstHour = from / 60
  const pct = (time: string) => ((toMinutes(time) - from) / span) * 100
  const columns = { gridTemplateColumns: `repeat(${hours}, minmax(0, 1fr))` }

  return (
    <div data-slot="booking-timeline" className={cn("grid gap-3", className)}>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="ml-36 grid h-5 text-[11px] text-muted-foreground tabular-nums" style={columns}>
            {Array.from({ length: hours }, (_, i) => (
              <span key={i} className="relative">
                {i % labelEvery === 0 && <span className="absolute -translate-x-1/2">{String(firstHour + i).padStart(2, "0")}</span>}
                {i === hours - 1 && (
                  <span className="absolute right-0">{String(firstHour + hours).padStart(2, "0")}</span>
                )}
              </span>
            ))}
          </div>

          <div className="grid gap-2">
            {rows.map((row) => {
              const placed = lanes(row.blocks)
              const laneCount = Math.max(1, ...placed.map((p) => p.lane + 1))
              return (
                <div key={row.id} className="flex items-center">
                  <div className="w-36 shrink-0 pr-3">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    {row.description && <p className="truncate text-xs text-muted-foreground">{row.description}</p>}
                  </div>
                  <div className="relative flex-1 overflow-hidden rounded-md bg-canvas" style={{ height: laneCount * LANE + 4 }}>
                    <div aria-hidden="true" className="absolute inset-0 grid" style={columns}>
                      {Array.from({ length: hours }, (_, i) => (
                        <span key={i} className={cn(i > 0 && "border-l border-border/60")} />
                      ))}
                    </div>
                    {placed.map(({ block: b, lane }) => {
                      const style = {
                        left: `${pct(b.start)}%`,
                        width: `${pct(b.end) - pct(b.start)}%`,
                        top: lane * LANE + 4,
                        height: LANE - 4,
                      }
                      const cls = cn(
                        "absolute flex min-w-0 flex-col justify-center overflow-hidden rounded-md border px-2 text-left text-xs leading-tight",
                        toneClass[b.tone]
                      )
                      const body = (
                        <>
                          <span className="truncate font-medium">{b.label}</span>
                          {b.detail && <span className="truncate text-muted-foreground tabular-nums">{b.detail}</span>}
                        </>
                      )
                      return b.onSelect ? (
                        <button
                          key={b.id}
                          type="button"
                          title={b.title}
                          aria-label={b.title}
                          onClick={b.onSelect}
                          className={cn(cls, "cursor-pointer outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50")}
                          style={style}
                        >
                          {body}
                        </button>
                      ) : (
                        <div key={b.id} title={b.title} className={cls} style={style}>
                          {body}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {legend && legend.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {legend.map((l) => (
            <span key={l.tone} className="flex items-center gap-1.5">
              <i className={cn("size-3 rounded-sm border", toneClass[l.tone])} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export { BookingTimeline }
export type { BookingTimelineProps, TimelineBlock, TimelineRow, TimelineTone }
